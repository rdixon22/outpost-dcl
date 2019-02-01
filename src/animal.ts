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
  public isFriendly:boolean = false; 
  public personalSpace:float = 4.0; // how close the player can get before the animal gets scared (in meters squared)
  
  // MOVEMENT
  public waypoints:Vector3[]; // OK, no navmesh so we're just predefining waypoints
  public waypointIndex:number = 0;
  public movesRandomly:boolean = true; // whether the animal chooses destinations at random, or in order
  public origin:Vector3; // the initial point the animal is moving from
  public destination:Vector3; // the current point the animal is moving towards
  public fraction:number;
  public inTransit:boolean = false;
  public currentSpeed = 2.0;
  public walkSpeed:float = 9.0;
  public runSpeed:float = 6.0;
  public speedFactor:float = 6.0;
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
    // create the entity
    const mod = new Entity();
  
    this.shape = new GLTFShape("models/" + _filename);
    log("Loading file: models/" + _filename);
    mod.set(this.shape);

    mod.set(new Transform({ scale: _scale})); // position: _position, 

    if (_idleClipNames == null || _idleClipNames.length == 0)
    {
        _idleClipNames.push("idle_1");
        _idleClipNames.push("idle_2");
    }

    let newClip:AnimationClip;
    for (var i:number = 0; i < _idleClipNames.length; i++)
    {
        newClip = new AnimationClip(this.animPrefix + _idleClipNames[i], {loop: true, speed: 0.8});
        this.shape.addClip(newClip);
        this.idleAnims.push(newClip);
        log("Added idle animation: " + this.animPrefix + _idleClipNames[i]);
    }
    // this.idleAnim = new AnimationClip(this.animPrefix + "idle_1", {loop: true, speed: 0.5});
    // this.shape.addClip(this.idleAnim);

    // this.idle2Anim = new AnimationClip(this.animPrefix + "idle_2", {loop: false});
    // this.shape.addClip(this.idle2Anim);

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

  attack() 
  {
    this.stopCurrentClip();
    this.attackAnim.playing = false;
    this.isFriendly = false;
    
    this.elapsed = 0;
    this.animDuration = this.attackDuration;

    this.currentClip = this.attackAnim;
    this.startCurrentClip();
  }

  think()
  {
    log(this.name + " is thinking...");
    // stop previous animations
    this.inTransit = false;
    this.stopCurrentClip();

    // Choices:
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
    //log("playing idle clip #" + rand);
    this.currentClip = this.idleAnims[rand];
    this.startCurrentClip();
  }

  walk() 
  {
    this.stopCurrentClip();
    this.planMovement();

    //log("WALKING from: " + this.origin + " to: " + this.destination);

    this.speedFactor = this.walkSpeed;
    this.currentClip = this.walkAnim;
    
    this.startCurrentClip();
  }

  run() 
  {
    this.stopCurrentClip();
    this.planMovement();

    //log("RUNNING from: " + this.origin + " to: " + this.destination);

    this.speedFactor = this.runSpeed;
    this.currentClip = this.runAnim;
    
    this.startCurrentClip();
  }

  planMovement()
  {
    this.origin = this.ent.get(Transform).position;
    
    // Pick a destination, then walk there
    this.destination = this.chooseDestination();

    // TODO: Orient the animal toward the destination -- this approach is not working
    this.ent.get(Transform).lookAt(this.destination);
    var rot:Quaternion = this.ent.get(Transform).rotation;
    this.ent.get(Transform).rotation = Quaternion.Inverse(rot);

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

  arrivedAtDestination():boolean
  {
      return this.hasArrived;
     // let pos:Vector3 = this.ent.get(Transform).position;
      // some tolerance is allowed
      //return (Vector3.DistanceSquared(pos, this.destination) < 0.1);
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
        //log("In transit to " + this.destination);
        // handle movement-based animations
        // check if we are at the destination
        if (this.arrivedAtDestination())
        {
            //log("Arrived!");
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
        //log(this.name + " currentClip.playing = " + this.currentClip.playing + ", elapsed=" + this.elapsed);
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
    let transform = this.ent.get(Transform); 

    this.fraction += dt / this.speedFactor;
    if (this.fraction > 1) 
    {
        this.fraction = 1;
        this.hasArrived = true;
    }

    // apply easing
    //var easeVal:number = this.easeOutCubic(this.fraction);
    //if (easeVal > 1) easeVal = 1;

    var newPos:Vector3 = Vector3.Lerp(
        this.origin,
        this.destination,
        this.fraction // easeval
    )
    transform.position = newPos;
    //log("dt = " + dt + ", fraction = " + this.fraction + ", new pos = " + newPos);
  }

    // EASING
    easeInCubic(t:number):number
    {
        return Math.pow(t,3);
    }

    easeOutCubic(t:number):number
    {
        return 1 - this.easeInCubic(1-t);
    }
}