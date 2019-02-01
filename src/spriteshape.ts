@Component("SpriteShape")
export class SpriteShape {

  public ent:Entity;
  public shape:Shape;
  public material:Material; 

  public fileNames:Array<string>;
  public totalFrames: number;

  // The current frame being shown
  public currentFrame: number = 0;

  public isAnimating: boolean = false;
  public isLooped: boolean = false;

  constructor(_entity:Entity, _shape:Shape, _textureFiles:Array<string>, _color:Color3 = Color3.Yellow(), _alpha:number = 0.8) 
  {
    //this.entity = new Entity();
    //this.entity.set(_shape);
    this.ent = _entity;
    if (!_textureFiles || _textureFiles.length == 0) return;

    this.fileNames = _textureFiles;
    this.totalFrames = _textureFiles.length;

    var mat = new Material();
    mat.albedoTexture = _textureFiles[0];
    //mat.emissiveTexture = _textureFiles[0];
    mat.emissiveColor = _color;
    mat.emissiveIntensity = 0.1;
    mat.hasAlpha = true;
    mat.alpha = 0.8;
    mat.transparencyMode = 2;
    this.material = mat;

    this.shape = _shape;
    _entity.set(_shape);
    _entity.set(this.material);

  }

  animate(loopIt:boolean = false)
  {
    this.currentFrame = 0;
    this.isLooped = loopIt;
    this.isAnimating = true;
  }

  stop()
  {
    this.isAnimating = false;
  }

  nextFrame()
  {
    if (!this.isAnimating) return this.currentFrame;
    //log("nextFrame()");
    this.currentFrame++;
    
    if (this.currentFrame >= this.totalFrames)
    {
      this.currentFrame = 0;
      if (this.isLooped)
      {
        // back to zero, and keep going
        
      }
      else
      {
        // stop now 
        this.isAnimating = false;
        return;
      }
    }
 
    // new workaround to remove material so display updates
    this.ent.remove(Material);

    this.material.albedoTexture = this.fileNames[this.currentFrame];
    this.material.hasAlpha = true;
    this.material.dirty = true;
    
    this.ent.set(this.material);

    //log("frame " + this.currentFrame);
  }
}