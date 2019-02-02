import { FiniteStateMachine } from "./typestate";
import { animal } from './animalstate';

@Component("Animal")
export class Animal {
  public name: string;

  public ent:Entity;
  public modelEntity:Entity;
  public modelFile:string;
  public shape:GLTFShape;

  // ANIMATION
  public animPrefix:string;

  public idleAnims:AnimationClip[] = new Array();
  public attackAnim:AnimationClip;
  public walkAnim:AnimationClip;
  public runAnim:AnimationClip;

  public currentClip:AnimationClip;
  public isAnimating:boolean = false;
  public idleDuration:float = 8.0;
  public attackDuration:float = 5.0;
  public animDuration:number;
  public elapsed:number;

  // STATE MACHINE and AI
  public fsm:FiniteStateMachine<animal.State>;
  public randomStates:animal.State[];
  public isFriendly:boolean = true; 
  public personalSpace:float = 4.0; // how close the player can get before the animal gets scared (in meters squared)
  
  // MOVEMENT
  public waypoints:Vector3[]; // OK, no navmesh so we're just predefining waypoints
  public waypointIndex:number = 0;
  public movesRandomly:boolean = true; // whether the animal chooses destinations at random, or in order
  public origin:Vector3; // the initial point the animal is moving from
  public destination:Vector3; // the current point the animal is moving towards
  public distance:float = 0;
  public traveled:float = 0;
  public fraction:number;
  public inTransit:boolean = false;

  public currentSpeed:float = 2.0;
  public walkSpeed:float = 0.6; // roughly meters per second
  public runSpeed:float = 2.2; // roughly meters per second

  public hasArrived:boolean = false;
  public tooClose:boolean = false;

  constructor(_name:string, _modelFile:string, _animPrefix:string, _idleClipNames:string[], _position: Vector3, _scale: Vector3) {
    this.name = _name;
    this.modelFile = _modelFile;
    this.animPrefix = _animPrefix;

    this.ent = new Entity();
    this.ent.set(new Transform({ position: _position }));
    engine.addEntity(this.ent);

    this.modelEntity = this.loadModel(_modelFile, _idleClipNames, _position, _scale);
    this.modelEntity.setParent(this.ent);
    engine.addEntity(this.modelEntity);

    this.setupStateMachine();

    this.ent.set(
      // not working!
      new OnClick(() => {
          log("clicked on " + this.name);
          this.fsm.go(animal.State.Attacking);
      })
    )
  }

  loadModel(_filename: string, _idleClipNames:string[], _position: Vector3, _scale: Vector3) {

    const mod = new Entity();
  
    this.shape = new GLTFShape("models/" + _filename);
    log("Loading file: models/" + _filename);
    mod.set(this.shape);

    mod.set(new Transform({ scale: _scale}));

    if (_idleClipNames == null || _idleClipNames.length == 0)
    {
        _idleClipNames.push("idle_1");
        _idleClipNames.push("idle_2");
    }

    // can have many different idle animations
    let newClip:AnimationClip;
    for (var i:number = 0; i < _idleClipNames.length; i++)
    {
        newClip = new AnimationClip(this.animPrefix + _idleClipNames[i], {loop: true, speed: 0.8});
        this.shape.addClip(newClip);
        this.idleAnims.push(newClip);
        log("Added idle animation: " + this.animPrefix + _idleClipNames[i]);
    }

    this.walkAnim = new AnimationClip(this.animPrefix + "walk", {loop: true});
    this.shape.addClip(this.walkAnim);

    this.runAnim = new AnimationClip(this.animPrefix + "run", {loop: true});
    this.shape.addClip(this.runAnim);

    this.attackAnim = new AnimationClip(this.animPrefix + "attack", {loop: false});
    this.shape.addClip(this.attackAnim);

    return mod;
  }

  setupStateMachine()
  {
    // Construct the FSM with the inital state
    this.fsm = new FiniteStateMachine<animal.State>(animal.State.Idle);
    
    // Valid state transitions
    // Start by thinking about what to do next
    this.fsm.from(animal.State.Thinking).toAny(animal.State);
    this.fsm.fromAny(animal.State).to(animal.State.Thinking);

    // Bolt away if the player is too close -- no thought, just instinct
    this.fsm.fromAny(animal.State).to(animal.State.Running);
    
    // Trigger the right methods for each state
    this.fsm.on(animal.State.Thinking, (from: animal.State) => {
        this.think();
    });
    this.fsm.on(animal.State.Idle, (from: animal.State) => {
        this.idle();
    });
    this.fsm.on(animal.State.Walking, (from: animal.State) => {
        this.walk();
    });
    this.fsm.on(animal.State.Running, (from: animal.State) => {
        this.run();
    });
    this.fsm.on(animal.State.Attacking, (from: animal.State) => {
        this.attack();
    });

    // Listen for transitions to interrupt if needed; if the callback returns false the transition is canceled.
    this.fsm.onEnter(animal.State.Walking, ()=>{
        // set inTransit, so if choosing a destination fails, nextFrame() will handle switching back to idle
        this.inTransit = true;
        if (this.waypoints == null || this.waypoints.length == 0)
        {
            return false;
        }
        return true;
    });
    this.fsm.onEnter(animal.State.Running, ()=>{
        // set inTransit, so if choosing a destination fails, nextFrame() will handle switching back to idle
        this.inTransit = true;
        if (this.waypoints == null || this.waypoints.length == 0)
        {
            return false;
        }
        return true;
    });

    // when no specific conditions are met, the animal can choose any of the following
    this.randomStates = [animal.State.Idle, animal.State.Idle, animal.State.Walking, animal.State.Running];
  }

  getShape() 
  {
    return this.modelEntity.get(GLTFShape);
  }

  think()
  {
    //log(this.name + " is thinking...");
    // stop previous animations
    this.inTransit = false;
    this.stopCurrentClip();

    // Future choices:
    // - If player is close, and not friendly, run away
    // - If food is nearby, go to it and eat
    // - Otherwise randomly choose Idle, Walk, or Run

    // for now, just choose a random action
    let rand:number = Math.floor(Math.random() * this.randomStates.length);
    this.fsm.go(this.randomStates[rand]); 
  }

  idle() {
    this.stopCurrentClip();

    this.elapsed = 0;
    this.animDuration = this.idleDuration;
    
    let rand:number = Math.floor(Math.random() * this.idleAnims.length);
    log(this.name + " playing idle clip #" + rand);
    this.currentClip = this.idleAnims[rand];
    this.startCurrentClip();
  }

  attack() 
  {
    this.stopCurrentClip();
    this.isFriendly = false;
    
    this.elapsed = 0;
    this.animDuration = this.attackDuration;

    this.currentClip = this.attackAnim;
    this.startCurrentClip();
  }

  walk() 
  {
    this.stopCurrentClip();
    this.planMovement();

    //log("WALKING from: " + this.origin + " to: " + this.destination);

    this.currentSpeed = this.walkSpeed;
    this.currentClip = this.walkAnim;
    
    this.startCurrentClip();
  }

  run() 
  {
    this.stopCurrentClip();
    this.planMovement();

    //log("RUNNING from: " + this.origin + " to: " + this.destination);

    this.currentSpeed = this.runSpeed;
    this.currentClip = this.runAnim;
    
    this.startCurrentClip();
  }

  planMovement()
  {
    this.origin = this.ent.get(Transform).position;
    
    // Pick a destination, then walk there
    this.destination = this.chooseDestination();

    // DONE: Orient the animal toward the destination -- Vector3.lookAt() did work as intended
    var angles:Vector3 = this.ent.get(Transform).rotation.eulerAngles;
    angles.y = Math.atan2(this.origin.x - this.destination.x, this.origin.z - this.destination.z)*180 / Math.PI;
    this.ent.get(Transform).rotation.eulerAngles = angles;
    
    this.distance = Vector3.Distance(this.ent.get(Transform).position, this.destination);
    this.traveled = 0;
    this.fraction = 0;

    this.inTransit = true;
    this.hasArrived = false;
  }

  startCurrentClip()
  {
      this.isAnimating = true;
      if (this.currentClip != null)
      {
        this.currentClip.weight = 1;
        this.currentClip.play();
      }
  }

  stopCurrentClip()
  {
      if (this.currentClip != null)
      {
        this.currentClip.pause();
        this.currentClip.playing = false;
        this.currentClip.weight = 0.0;
        this.currentClip = null;
      }
      this.isAnimating = false;
  }

  chooseDestination():Vector3
  {
    if (this.waypoints == null || this.waypoints.length == 0)
    {
        return Vector3.Zero();
    }
    else if (this.movesRandomly)
    {
        let rand:number = this.waypointIndex;
        while (rand == this.waypointIndex) {
            rand = Math.floor(Math.random() * this.waypoints.length);
        }
        this.waypointIndex = rand;
        return this.waypoints[this.waypointIndex];
    }
    else
    {
        this.waypointIndex++;
        if (this.waypointIndex >= this.waypoints.length)
        {
            this.waypointIndex = 0;
        }
        return this.waypoints[this.waypointIndex];
    }
  }

  playerIsTooClose():boolean
  {
      let pos:Vector3 = this.ent.get(Transform).position;
      // using DistanceSquared since it should be more performant
      return (Vector3.DistanceSquared(pos, Camera.instance.position) < this.personalSpace);
  }

  nextFrame(dt: number)
  {
    if (!this.tooClose && this.playerIsTooClose())
    {
        log("Player too close!");
        // drop everything and run away!
        this.tooClose = true;
        this.inTransit = false;
        this.stopCurrentClip();
        this.fsm.go(animal.State.Running);
    }
    else if (this.inTransit)
    {
        // handle movement-based animations
        // check if we are at the destination
        if (this.hasArrived)
        {
            this.tooClose = false;

            this.fsm.go(animal.State.Thinking);
        }
        else
        {
            // move toward the destination
            this.move(dt);
        }
    }
    else if (this.isAnimating) 
    {
        // handle non-movement animations
        this.elapsed += dt;

        if (this.elapsed > this.animDuration)
        {
            // clip has stopped
            this.isAnimating = false;
            this.elapsed = 0;

            if (!this.fsm.is(animal.State.Thinking))
            {
                // decide what to do next
                this.fsm.go(animal.State.Thinking);
            }
        }
    }
  }

  move(dt: number)
  {
    // changing to use a constant movement speed
    this.traveled += (dt * this.currentSpeed);

    if (this.traveled > this.distance) 
    {
        this.traveled = this.distance;
        this.hasArrived = true;
    }

    this.fraction = this.traveled / this.distance;

    var newPos:Vector3 = Vector3.Lerp(
        this.origin,
        this.destination,
        this.fraction
    )
    this.ent.get(Transform).position = newPos;
  }
}