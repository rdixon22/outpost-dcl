@Component("Portable")
export class Portable {

  public ent:Entity;
  public trans:Transform; // dereference the transform for speed
  public isHeld:boolean = false;
  
  private distance:float = 1.0;

  constructor(_entity:Entity) {
    this.ent = _entity;
    this.trans = _entity.getOrCreate(Transform);

    this.ent.set(
        new OnClick(() => {
          log("clicked on Portable object, isHeld=" + this.isHeld);
          if (this.isHeld)
          {
            this.drop();
          }
          else
          {
            this.carry();
          }
        })
      )
  }

  carry()
  {
    this.putInFront();
    this.isHeld = true;
  }

  drop()
  {
    this.isHeld = false;

    // Where to put it? Avatar muc be a certain height from the floor.
    this.putInFront(true);
  }

  nextFrame()
  {
    if (!this.isHeld) return;

    this.putInFront();
  }

  putInFront(onFloor:boolean = false)
  {
    let newPos:Vector3 = Camera.instance.position.clone();

    if (!onFloor)
    {
        newPos.y += 0.8;
    }
    else
    {
      newPos.y += 0.1;
    }
    
    let angles:Vector3 = Camera.instance.rotation.eulerAngles;
    let radians:float = angles.y * Math.PI / 180;
    newPos.x = newPos.x + (this.distance * Math.sin(radians));
    newPos.z = newPos.z + (this.distance * Math.cos(radians));

    this.trans.position = newPos;
  }
}