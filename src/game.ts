import { SpriteShape } from "./spriteshape";
import { Animal } from "./animal";
import { Portable } from "./portable";

/// -------- SCENE CREATION FUNCTIONS --------

function spawnModel(filename: string, x: number, y: number, z: number, scaleX: number = 1, scaleY: number = 1, scaleZ: number = 1) {
  // create the entity
  const mod = new Entity();
  mod.set(new GLTFShape("models/" + filename));

  // set a transform to the entity
  mod.set(new Transform({ position: new Vector3(x, y, z),
                          scale: new Vector3(scaleX, scaleY, scaleZ) }));

  // add the entity to the engine
  engine.addEntity(mod);
  return mod;
}

/// -------- SCENE SET-UP --------

const terrain = spawnModel("Terrain2.gltf", -39.98, 0, 0,  0.78, 0.78, 0.78);
terrain.get(Transform).rotation.eulerAngles = new Vector3(0, 180, 0);

const corner1 = spawnModel("outpostcorner/scene.gltf", 6.5, 10.35, 65,  0.75, 0.75, 0.75);
corner1.get(Transform).rotation.eulerAngles = new Vector3(0, 90, 0);

// reuse this shape since there are no animationss
const cornerShape = corner1.get(GLTFShape);

const corner2 = new Entity();
corner2.set(cornerShape);
corner2.set(new Transform({position: new Vector3(6.5, 10.35, 56), scale: new Vector3(0.75, 0.75, 0.75)}));
corner2.get(Transform).rotation.eulerAngles = new Vector3(0, -90, 0);
engine.addEntity(corner2);

const projector = spawnModel("projector/scene.gltf", -3, 10.4, 65,  0.6, 0.6, 0.6);

const chair = spawnModel("pilotseat/scene.gltf", 14.1, 10.4, 60.8,  0.8, 0.8, 0.8);

const firstClue = spawnModel("FirstClue.gltf", 18, 0.1, 13.5,  0.5, 0.5, 0.5);
firstClue.set(new Portable(firstClue));

// Floating ball over the projector
const ball = new Entity();
var ballShape = new SphereShape();
const fileNames3 = [
  "textures/bbumps_01.png", 
  "textures/bbumps_02.png", 
  "textures/bbumps_03.png", 
  "textures/bbumps_04.png",
  "textures/bbumps_05.png", 
  "textures/bbumps_06.png",
  "textures/bbumps_07.png", 
  "textures/bbumps_08.png", 
  "textures/bbumps_09.png", 
  "textures/bbumps_10.png",
  "textures/bbumps_11.png", 
  "textures/bbumps_12.png",
  "textures/bbumps_13.png",
  "textures/bbumps_14.png",
  "textures/bbumps_15.png",
  "textures/bbumps_16.png",
  "textures/bbumps_15.png",
  "textures/bbumps_14.png",
  "textures/bbumps_13.png",
  "textures/bbumps_12.png",
  "textures/bbumps_11.png", 
  "textures/bbumps_10.png",
  "textures/bbumps_09.png", 
  "textures/bbumps_08.png", 
  "textures/bbumps_07.png", 
  "textures/bbumps_06.png",
  "textures/bbumps_05.png", 
  "textures/bbumps_04.png",
  "textures/bbumps_03.png", 
  "textures/bbumps_02.png"
];
const waterBall = new SpriteShape(ball, ballShape, fileNames3, Color3.Blue(), 1.0);
ball.set(waterBall);
ball.set(new Transform({position: new Vector3(4.3, 12, 64.96), scale: new Vector3(2, 1.4, 2)}));
ball.get(Transform).rotation.eulerAngles = new Vector3(0, 90, 0);
let ballShown:boolean = false;

projector.set(
  new OnClick(() => {
      log("clicked on projector");
      if (!ballShown)
      {
        engine.addEntity(ball);
        waterBall.animate(true);
        ballShown = true;
      }
      else
      {
        waterBall.stop();
        engine.removeEntity(ball);
        ballShown = false;
      }
  })
)

// -------- ANIMALS --------

// BUNNIES
var idleClipNames:string[] = ["idle_1", "idle_2", "eat"];
var bunny1:Animal = new Animal("bunny1", "Low_Rabbit_v01.gltf", "Arm_rabbit|", idleClipNames, new Vector3(-21.5, 0.01, 31), new Vector3(1.8, 1.8, 1.8));
// add the component to the entity so the system will pick it up
bunny1.ent.add(bunny1);

var bunnyWays:Vector3[] = new Array();
bunnyWays.push(new Vector3(-21.6, 0.01, 35.58));
bunnyWays.push(new Vector3(-21.9, 0.01, 42.45));
bunnyWays.push(new Vector3(-14.8, 0.01, 40.4));
bunnyWays.push(new Vector3(-11.3, 0.01, 42.3));
bunnyWays.push(new Vector3(-19.3, 0.01, 48.5));

bunny1.waypoints = bunnyWays;
bunny1.movesRandomly = true;
bunny1.walkSpeed -= 0.1; // bunnies walk slow
bunny1.idle();


var bunny2:Animal = new Animal("bunny2", "Low_Rabbit_v01.gltf", "Arm_rabbit|", idleClipNames, new Vector3(-20.5, 0.01, 30), new Vector3(1.8, 1.8, 1.8));
bunny2.ent.add(bunny2);

var bunnyWays2:Vector3[] = new Array();
bunnyWays2.push(new Vector3(-20.5, 0.01, 35.08));
bunnyWays2.push(new Vector3(-20.8, 0.01, 41.95));
bunnyWays2.push(new Vector3(-10.2, 0.01, 42.2));
bunnyWays2.push(new Vector3(-21.2, 0.01, 48.2));
bunnyWays2.push(new Vector3(-16.2, 0.01, 44.2));

bunny2.waypoints = bunnyWays2;
bunny2.movesRandomly = true;
bunny1.walkSpeed -= 0.1; // bunnies walk slow
bunny2.idle();

// CAT
idleClipNames.push("sit_idle");
idleClipNames.push("sit_idle_2");
var cat1:Animal = new Animal("cat1", "Low_Cat_v01.gltf", "Cat_arm|", idleClipNames, new Vector3(9, 0.1, 30), new Vector3(1, 1, 1));
cat1.ent.add(cat1);

var catWays:Vector3[] = new Array();
catWays.push(new Vector3(4.5, 0.1, 33));
catWays.push(new Vector3(22, 0.1, 28));
catWays.push(new Vector3(35, 0.1, 29));
catWays.push(new Vector3(40.4, 0.1, 26.2));
catWays.push(new Vector3(37.4, 0.1, 15.5));
catWays.push(new Vector3(18.8, 0.1, 15.3));
catWays.push(new Vector3(18.6, 2.5, 18.4));
catWays.push(new Vector3(23.6, 2.5, 20.8));
catWays.push(new Vector3(23.7, 0.2, 23.7));
catWays.push(new Vector3(22, 0.1, 28));

cat1.waypoints = catWays;
cat1.movesRandomly = false;
cat1.idle();

/// -------- INPUT --------

const input = Input.instance; 

// log our camera location when we click
input.subscribe("BUTTON_A_DOWN", e => {
  log("camera pos: ", Camera.instance.position)
})

// log the position of what we click on
input.subscribe("BUTTON_A_UP", e => {
  log("buttonUp", e)
})

/// -------- SYSTEMS --------

// SpriteShapes animate the textures on boxes, cylinders, or spheres
class SpriteShapeSystem implements ISystem  {
  public group:ComponentGroup = engine.getComponentGroup(SpriteShape);

  update(dt: number) {
    for (let entity of this.group.entities) {
      const s = entity.get(SpriteShape);
      s.nextFrame();
    }
  }
}
let spriteShapeHandler:SpriteShapeSystem = new SpriteShapeSystem();
log("SpriteShapeSystem has " + spriteShapeHandler.group.entities.length);
// Add a new instance of the system to the engine
engine.addSystem(new SpriteShapeSystem());


// PortableSystem manages object that the avatar can carry around with them
class PortableSystem implements ISystem  {
  public group:ComponentGroup = engine.getComponentGroup(Portable);

  update(dt: number) {
    for (let entity of this.group.entities) {
      const obj:Portable = entity.get(Portable);
      obj.nextFrame(dt);
    }
  }
}
engine.addSystem(new PortableSystem());

// AnimalSystem handles animal movement and AI
class AnimalSystem implements ISystem {
  public group:ComponentGroup = engine.getComponentGroup(Animal);
  
  update(dt: number) {
    for (let entity of this.group.entities) {
      const obj:Animal = entity.get(Animal);
      obj.nextFrame(dt);
    }
  }
}
engine.addSystem(new AnimalSystem());
