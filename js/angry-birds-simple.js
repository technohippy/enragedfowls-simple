var AngryBirds = AngryBirds || {};

var $ = $ || function(id) { return document.getElementById(id) };

AngryBirds.Texture = {
  BIRD: THREE.ImageUtils.loadTexture('image/bird.jpg'),
  BOARD: THREE.ImageUtils.loadTexture('image/board.jpg'),
  get GRASS() {
    if (!this._GRASS) {
      this._GRASS = THREE.ImageUtils.loadTexture('image/grass_grass_0100_02_preview.jpg');
      this._GRASS.wrapS = THREE.RepeatWrapping;
      this._GRASS.wrapT = THREE.RepeatWrapping;
      this._GRASS.repeat.set(100, 100);
    }
    return this._GRASS;
  }
};

AngryBirds.Game = function(opts) {
  this.isPhysical = false;
  this.isStepping = false;
  this.threeScene = null;
  this.threeRenderer = null;
  this.threeCamera = null;
  this.threeGround = null;
  this.threeSlingshot = null;
  this.threeBlocks = null;
  this.threeBird = null;
};

AngryBirds.Game.prototype = {
  constructor: AngryBirds.Game,

  construct: function() {
    this.constructScene();
    this.constructStage();
    this.constructEventHandlers();
    this.constructPhysicalWorld();
    document.body.appendChild(this.threeRenderer.domElement);
  },

  constructScene: function() {
    this.threeScene = new THREE.Scene();
    this.threeCamera = this.createCamera();
    this.threeRenderer = this.createRenderer(this.threeCamera);

    this.threeScene.add(this.threeCamera);
    this.threeScene.add(this.threeRenderer);
    this.threeScene.add(this.createDirectionalLight());
    this.threeScene.add(this.createAmbientLight());
  },

  constructStage: function() {
    this.threeGround = this.createGround();
    this.threeSlingshot = this.createSlingshot();
    this.threeBlocks = this.createBlocks();
    this.threeBird = this.createBird();

    this.threeScene.add(this.threeGround);
    this.threeScene.add(this.threeSlingshot);
    this.threeBlocks.forEach(function(threeBlock) {
      this.threeScene.add(threeBlock);
    }.bind(this));
    this.threeScene.add(this.threeBird);
  },

  createCamera: function() {
    var camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight);
    camera.position = new THREE.Vector3(-20, 8, 12);
    camera.lookAt(new THREE.Vector3(0, 5, 12));
    return camera;
  },

  createRenderer: function(camera) {
    var renderer = new THREE.WebGLRenderer({antialias:true, alpha:true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0xccccff, 1);
    renderer.shadowMapEnabled = true;
    renderer.shadowMapSoft = true;
    renderer.shadowMapType = THREE.PCFShadowMap;
    return renderer;
  },

  createDirectionalLight: function() {
    var light = new THREE.DirectionalLight(0xffffff);
    light.position = new THREE.Vector3(-5, 20, -10);

    light.castShadow = true;
    light.shadowBias = 0.0001;
    light.shadowCameraNear = 1;
    light.shadowCameraFar = 100;
    light.shadowCameraLeft = -50;
    light.shadowCameraRight = 50;
    light.shadowCameraTop = 50;
    light.shadowCameraBottom = -50;
    light.shadowMapWidth = 1024;
    light.shadowMapHeight = 1024;

    return light;
  },

  createAmbientLight: function() {
    return new THREE.AmbientLight(0x666666);
  },

  createGround: function() {
    var simplexNoise = new SimplexNoise();
    var groundGeometry = new THREE.PlaneGeometry(300, 300, 64, 64);
    for (var i = 0; i < groundGeometry.vertices.length; i++) {
      var vertex = groundGeometry.vertices[i];
      vertex.z = simplexNoise.noise(vertex.x / 40, vertex.y / 40);
    }
    groundGeometry.computeFaceNormals();
    groundGeometry.computeVertexNormals();
    var groundMaterial = new THREE.MeshPhongMaterial({
      map:AngryBirds.Texture.GRASS
    });
    var ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.castShadow = false;
    ground.receiveShadow = true;
    ground.quaternion.setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI/2);
    return ground;
  },

  createBlock: function(size, position) {
    var blockGeometry = new THREE.BoxGeometry(size.width, size.height, size.depth);
    var blockMaterial = new THREE.MeshPhongMaterial({
      map:AngryBirds.Texture.BOARD
    });
    var block = new THREE.Mesh(blockGeometry, blockMaterial);
    block.castShadow = true;
    block.receiveShadow = true;
    block.position.copy(new THREE.Vector3(position.x, position.y, position.z));
    return block;
  },

  createBlocks: function() {
    var blocks = [];
    var denPosition = {x:0, z:20};
    var dx, dz;
    var baseHeight = 1;
    var block;

    block = this.createBlock(
      {width:10, height:2.2, depth:10}, 
      {x:denPosition.x, y:0, z:denPosition.z}
    );
    blocks.push(block);
    baseHeight += 0.2/2;

    block = this.createBlock(
      {width:8, height:1.4, depth:0.4},
      {x:denPosition.x, y:baseHeight+1.4/2, z:denPosition.z-4}
    );
    blocks.push(block);

    block = this.createBlock(
      {width:8, height:1.4, depth:0.4},
      {x:denPosition.x, y:baseHeight+1.4/2, z:denPosition.z+4}
    );
    blocks.push(block);

    // base outer frame
    for (dx = -2; dx <= 2; dx += 4) {
      for (dz = -2; dz <= 2; dz += 4) {
        block = this.createBlock(
          {width:0.7, height:6, depth:0.7}, 
          {x:denPosition.x+dx, y:baseHeight+6/2, z:denPosition.z+dz}
        );
        blocks.push(block);
      }
    }

    block = this.createBlock(
      {width:6, height:0.2, depth:6},
      {x:denPosition.x, y:baseHeight+6+0.2/2, z:denPosition.z}
    );
    blocks.push(block);

    // top frame
    baseHeight += 6+0.2;
    for (dx = -1; dx <= 1; dx += 2) {
      for (dz = -1; dz <= 1; dz += 2) {
        block = this.createBlock(
          {width:0.6, height:4.4, depth:0.6},
          {x:denPosition.x-dx, y:baseHeight+4.4/2, z:denPosition.z-dz}
        );
        blocks.push(block);
      }
    }

    block = this.createBlock(
      {width:3.4, height:0.2, depth:3.4},
      {x:denPosition.x, y:baseHeight+4.4+0.2/2, z:denPosition.z}
    );
    blocks.push(block);

    return blocks;
  },

  createBird: function() {
    var birdGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    var birdMaterial = new THREE.MeshPhongMaterial({
      map:AngryBirds.Texture.BIRD
    });
    var bird = new THREE.Mesh(birdGeometry, birdMaterial);
    bird.castShadow = true;
    bird.receiveShadow = true;
    bird.position.copy(new THREE.Vector3(0, 2.5 + 2 + 0.1, 0));
    bird.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI/2);
    return bird;
  },

  createSlingshot: function() {
    var slingshotGeometry = new THREE.Geometry();
    var barGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 8);
    var bar = new THREE.Mesh(barGeometry);
    bar.position.set(0, 2.5/2, 0);

    var armGeometry = new THREE.TorusGeometry(2, 0.2, 8, 16, Math.PI);
    var arm = new THREE.Mesh(armGeometry);
    arm.position.set(0, 2.5+2+0.2-0.03, 0);
    arm.quaternion.setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI);
    
    THREE.GeometryUtils.merge(slingshotGeometry, bar);
    THREE.GeometryUtils.merge(slingshotGeometry, arm);
    var slingshot = new THREE.Mesh(slingshotGeometry, new THREE.MeshPhongMaterial({
      castShadow:true, receiveShadow:true,
      map:AngryBirds.Texture.BOARD
    }));
    slingshot.castShadow = true;
    return slingshot;
  },

  constructPhysicalWorld: function() {
    this.cannonWorld = new CANNON.World();
    this.cannonWorld.gravity.set(0,-9.82,0);
    this.cannonWorld.broadphase = new CANNON.NaiveBroadphase();

    this.cannonGround = this.createPhysicalGround();
    this.cannonBlocks = this.createPhysicalBlocks();
    this.cannonBird = this.createPhysicalBird();

    this.cannonWorld.add(this.cannonGround);
    this.cannonBlocks.forEach(function(cannonBlock) {
      this.cannonWorld.add(cannonBlock);
    }.bind(this));
    this.cannonWorld.add(this.cannonBird);
  },

  createPhysicalGround: function() {
    var groundShape = new CANNON.Plane();
    var groundBody = new CANNON.RigidBody(0, groundShape);
    groundBody.quaternion = new CANNON.Quaternion();
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    return groundBody;
  },

  createPhysicalBlock: function(size, position, mass) {
    var blockShape = new CANNON.Box(new CANNON.Vec3(size.width/2, size.height/2, size.depth/2));
    if (typeof(mass) === 'undefined') {
      var density = 1;
      mass = size.width * size.height * size.depth * density;
    }
    var blockBody = new CANNON.RigidBody(mass, blockShape);
    blockBody.position.set(position.x, position.y, position.z);
    blockBody.angularDamping = 0.8;
    return blockBody;
  },

  createPhysicalBlocks: function() {
    var blocks = [];
    var denPosition = {x:0, z:20};
    var dx, dz;
    var baseHeight = 1;
    var block;

    block = this.createPhysicalBlock(
      {width:10, height:2.2, depth:10}, 
      {x:denPosition.x, y:0, z:denPosition.z}, 0
    );
    blocks.push(block);
    baseHeight += 0.2/2;

    block = this.createPhysicalBlock(
      {width:8, height:1.4, depth:0.4},
      {x:denPosition.x, y:baseHeight+1.4/2, z:denPosition.z-4}
    );
    blocks.push(block);

    block = this.createPhysicalBlock(
      {width:8, height:1.4, depth:0.4},
      {x:denPosition.x, y:baseHeight+1.4/2, z:denPosition.z+4}
    );
    blocks.push(block);

    // base outer frame
    for (dx = -2; dx <= 2; dx += 4) {
      for (dz = -2; dz <= 2; dz += 4) {
        block = this.createPhysicalBlock(
          {width:0.7, height:6, depth:0.7}, 
          {x:denPosition.x+dx, y:baseHeight+6/2, z:denPosition.z+dz}
        );
        blocks.push(block);
      }
    }

    block = this.createPhysicalBlock(
      {width:6, height:0.2, depth:6},
      {x:denPosition.x, y:baseHeight+6+0.2/2, z:denPosition.z}
    );
    blocks.push(block);

    // top frame
    baseHeight += 6+0.2;
    for (dx = -1; dx <= 1; dx += 2) {
      for (dz = -1; dz <= 1; dz += 2) {
        block = this.createPhysicalBlock(
          {width:0.6, height:4.4, depth:0.6},
          {x:denPosition.x-dx, y:baseHeight+4.4/2, z:denPosition.z-dz}
        );
        blocks.push(block);
      }
    }

    block = this.createPhysicalBlock(
      {width:3.4, height:0.2, depth:3.4},
      {x:denPosition.x, y:baseHeight+4.4+0.2/2, z:denPosition.z}
    );
    blocks.push(block);

    return blocks;
  },

  createPhysicalBird: function() {
    var birdShape = new CANNON.Sphere(0.5);
    var birdBody = new CANNON.RigidBody(10, birdShape);
    birdBody.position.set(0, 2.5 + 2 + 0.1, 0);
    return birdBody;
  },

  constructEventHandlers: function() {
    window.addEventListener('resize', function() {
      this.threeRenderer.setSize(window.innerWidth, window.innerHeight);
      this.threeCamera.aspect = window.innerWidth / window.innerHeight;
      this.threeCamera.updateProjectionMatrix();
    }.bind(this), false);

    document.addEventListener('keypress', function() {
      if (event.charCode === 13) { // enter
        this.isStepping = false;
        this.threeBird.position.copy(new THREE.Vector3(0, 2.5 + 2 + 0.1, 0));
      }
      else if (event.charCode === 32) { // space
        this.isStepping = !this.isStepping;
      }
      else if (event.charCode === 112) { // 'p'
        this.isPhysical = true;
      }
    }.bind(this));
  },

  render: function() {
    this.threeRenderer.render(this.threeScene, this.threeCamera);
  },

  move: function() {
    this.threeBird.position.y += 0.028;
    this.threeBird.position.z += 0.2;
  },

  sync: function() {
    this.threeBird.position.copy(this.cannonBird.position);
    this.threeBird.quaternion.copy(this.cannonBird.quaternion);

    for (var i = 0; i < this.threeBlocks.length; i++) {
      var threeBlock = this.threeBlocks[i];
      var cannonBlock = this.cannonBlocks[i];
      threeBlock.position.copy(cannonBlock.position);
      threeBlock.quaternion.copy(cannonBlock.quaternion);
    }
  },

  step: function() {
    if (this.isStepping) {
      this.cannonWorld.step(1.0/24.0);
      if (this.isPhysical) {
        if (!this.isShot) {
          this.cannonBird.position.set(0, 2.5 + 2 + 0.1, 0);
          this.cannonBird.applyImpulse(new CANNON.Vec3(0, 100, 100), this.cannonBird.position);
          this.isShot = true;
        }
        this.sync();
      }
      else {
        this.move();
      }
    }
    this.render();
    window.requestAnimationFrame(this.step.bind(this));
  },

  start: function() {
    this.construct();
    this.step();
  }
};

AngryBirds.Game.start = function(opts) {
  new AngryBirds.Game(opts || {}).start();
};
