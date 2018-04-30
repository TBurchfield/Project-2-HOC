import { Vector3 as Vector3$1, Matrix4, Quaternion, Euler, Mesh, SphereGeometry, MeshNormalMaterial, BoxGeometry, BufferGeometry, Vector2, BufferAttribute, Object3D } from 'three';
import { Loop } from 'whs';

var MESSAGE_TYPES = {
  WORLDREPORT: 0,
  COLLISIONREPORT: 1,
  VEHICLEREPORT: 2,
  CONSTRAINTREPORT: 3,
  SOFTREPORT: 4
};

var REPORT_ITEMSIZE = 14,
    COLLISIONREPORT_ITEMSIZE = 5,
    VEHICLEREPORT_ITEMSIZE = 9,
    CONSTRAINTREPORT_ITEMSIZE = 6;

var temp1Vector3 = new Vector3$1(),
    temp2Vector3 = new Vector3$1(),
    temp1Matrix4 = new Matrix4(),
    temp1Quat = new Quaternion();

var getEulerXYZFromQuaternion = function getEulerXYZFromQuaternion(x, y, z, w) {
  return new Vector3$1(Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z), Math.asin(2 * (x * z + y * w)), Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z));
};

var getQuatertionFromEuler = function getQuatertionFromEuler(x, y, z) {
  var c1 = Math.cos(y);
  var s1 = Math.sin(y);
  var c2 = Math.cos(-z);
  var s2 = Math.sin(-z);
  var c3 = Math.cos(x);
  var s3 = Math.sin(x);
  var c1c2 = c1 * c2;
  var s1s2 = s1 * s2;

  return {
    w: c1c2 * c3 - s1s2 * s3,
    x: c1c2 * s3 + s1s2 * c3,
    y: s1 * c2 * c3 + c1 * s2 * s3,
    z: c1 * s2 * c3 - s1 * c2 * s3
  };
};

var convertWorldPositionToObject = function convertWorldPositionToObject(position, object) {
  temp1Matrix4.identity(); // reset temp matrix

  // Set the temp matrix's rotation to the object's rotation
  temp1Matrix4.identity().makeRotationFromQuaternion(object.quaternion);

  // Invert rotation matrix in order to "unrotate" a point back to object space
  temp1Matrix4.getInverse(temp1Matrix4);

  // Yay! Temp vars!
  temp1Vector3.copy(position);
  temp2Vector3.copy(object.position);

  // Apply the rotation
  return temp1Vector3.sub(temp2Vector3).applyMatrix4(temp1Matrix4);
};

var addObjectChildren = function addObjectChildren(parent, object) {
  for (var i = 0; i < object.children.length; i++) {
    var child = object.children[i];
    var physics = child.component ? child.component.use('physics') : false;

    if (physics) {
      var data = physics.data;

      child.updateMatrix();
      child.updateMatrixWorld();

      temp1Vector3.setFromMatrixPosition(child.matrixWorld);
      temp1Quat.setFromRotationMatrix(child.matrixWorld);

      data.position_offset = {
        x: temp1Vector3.x,
        y: temp1Vector3.y,
        z: temp1Vector3.z
      };

      data.rotation = {
        x: temp1Quat.x,
        y: temp1Quat.y,
        z: temp1Quat.z,
        w: temp1Quat.w
      };

      parent.component.use('physics').data.children.push(data);
    }

    addObjectChildren(parent, child);
  }
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

var Eventable = function () {
  function Eventable() {
    classCallCheck(this, Eventable);

    this._eventListeners = {};
  }

  createClass(Eventable, [{
    key: "addEventListener",
    value: function addEventListener(event_name, callback) {
      if (!this._eventListeners.hasOwnProperty(event_name)) this._eventListeners[event_name] = [];

      this._eventListeners[event_name].push(callback);
    }
  }, {
    key: "removeEventListener",
    value: function removeEventListener(event_name, callback) {
      var index = void 0;

      if (!this._eventListeners.hasOwnProperty(event_name)) return false;

      if ((index = this._eventListeners[event_name].indexOf(callback)) >= 0) {
        this._eventListeners[event_name].splice(index, 1);
        return true;
      }

      return false;
    }
  }, {
    key: "dispatchEvent",
    value: function dispatchEvent(event_name) {
      var i = void 0;
      var parameters = Array.prototype.splice.call(arguments, 1);

      if (this._eventListeners.hasOwnProperty(event_name)) {
        for (i = 0; i < this._eventListeners[event_name].length; i++) {
          this._eventListeners[event_name][i].apply(this, parameters);
        }
      }
    }
  }], [{
    key: "make",
    value: function make(obj) {
      obj.prototype.addEventListener = Eventable.prototype.addEventListener;
      obj.prototype.removeEventListener = Eventable.prototype.removeEventListener;
      obj.prototype.dispatchEvent = Eventable.prototype.dispatchEvent;
    }
  }]);
  return Eventable;
}();

var ConeTwistConstraint = function () {
  function ConeTwistConstraint(obja, objb, position) {
    classCallCheck(this, ConeTwistConstraint);

    var objecta = obja;
    var objectb = obja;

    if (position === undefined) console.error('Both objects must be defined in a ConeTwistConstraint.');

    this.type = 'conetwist';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.objectb = objectb.use('physics').data.id;
    this.positionb = convertWorldPositionToObject(position, objectb).clone();
    this.axisa = { x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z };
    this.axisb = { x: objectb.rotation.x, y: objectb.rotation.y, z: objectb.rotation.z };
  }

  createClass(ConeTwistConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axisa: this.axisa,
        axisb: this.axisb
      };
    }
  }, {
    key: 'setLimit',
    value: function setLimit(x, y, z) {
      if (this.worldModule) this.worldModule.execute('conetwist_setLimit', { constraint: this.id, x: x, y: y, z: z });
    }
  }, {
    key: 'enableMotor',
    value: function enableMotor() {
      if (this.worldModule) this.worldModule.execute('conetwist_enableMotor', { constraint: this.id });
    }
  }, {
    key: 'setMaxMotorImpulse',
    value: function setMaxMotorImpulse(max_impulse) {
      if (this.worldModule) this.worldModule.execute('conetwist_setMaxMotorImpulse', { constraint: this.id, max_impulse: max_impulse });
    }
  }, {
    key: 'setMotorTarget',
    value: function setMotorTarget(target) {
      if (target instanceof Vector3$1) target = new Quaternion().setFromEuler(new Euler(target.x, target.y, target.z));else if (target instanceof Euler) target = new Quaternion().setFromEuler(target);else if (target instanceof Matrix4) target = new Quaternion().setFromRotationMatrix(target);

      if (this.worldModule) this.worldModule.execute('conetwist_setMotorTarget', {
        constraint: this.id,
        x: target.x,
        y: target.y,
        z: target.z,
        w: target.w
      });
    }
  }]);
  return ConeTwistConstraint;
}();

var HingeConstraint = function () {
  function HingeConstraint(obja, objb, position, axis) {
    classCallCheck(this, HingeConstraint);

    var objecta = obja;
    var objectb = objb;

    if (axis === undefined) {
      axis = position;
      position = objectb;
      objectb = undefined;
    }

    this.type = 'hinge';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.position = position.clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(HingeConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axis: this.axis
      };
    }
  }, {
    key: 'setLimits',
    value: function setLimits(low, high, bias_factor, relaxation_factor) {
      if (this.worldModule) this.worldModule.execute('hinge_setLimits', {
        constraint: this.id,
        low: low,
        high: high,
        bias_factor: bias_factor,
        relaxation_factor: relaxation_factor
      });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(velocity, acceleration) {
      if (this.worldModule) this.worldModule.execute('hinge_enableAngularMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableMotor',
    value: function disableMotor() {
      if (this.worldModule) this.worldModule.execute('hinge_disableMotor', { constraint: this.id });
    }
  }]);
  return HingeConstraint;
}();

var PointConstraint = function () {
  function PointConstraint(obja, objb, position) {
    classCallCheck(this, PointConstraint);

    var objecta = obja;
    var objectb = objb;

    if (position === undefined) {
      position = objectb;
      objectb = undefined;
    }

    this.type = 'point';
    this.appliedImpulse = 0;
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(PointConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb
      };
    }
  }]);
  return PointConstraint;
}();

var SliderConstraint = function () {
  function SliderConstraint(obja, objb, position, axis) {
    classCallCheck(this, SliderConstraint);

    var objecta = obja;
    var objectb = objb;

    if (axis === undefined) {
      axis = position;
      position = objectb;
      objectb = undefined;
    }

    this.type = 'slider';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axis = axis;

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
    }
  }

  createClass(SliderConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axis: this.axis
      };
    }
  }, {
    key: 'setLimits',
    value: function setLimits(lin_lower, lin_upper, ang_lower, ang_upper) {
      if (this.worldModule) this.worldModule.execute('slider_setLimits', {
        constraint: this.id,
        lin_lower: lin_lower,
        lin_upper: lin_upper,
        ang_lower: ang_lower,
        ang_upper: ang_upper
      });
    }
  }, {
    key: 'setRestitution',
    value: function setRestitution(linear, angular) {
      if (this.worldModule) this.worldModule.execute('slider_setRestitution', {
        constraint: this.id,
        linear: linear,
        angular: angular
      });
    }
  }, {
    key: 'enableLinearMotor',
    value: function enableLinearMotor(velocity, acceleration) {
      if (this.worldModule) this.worldModule.execute('slider_enableLinearMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableLinearMotor',
    value: function disableLinearMotor() {
      if (this.worldModule) this.worldModule.execute('slider_disableLinearMotor', { constraint: this.id });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(velocity, acceleration) {
      this.scene.execute('slider_enableAngularMotor', {
        constraint: this.id,
        velocity: velocity,
        acceleration: acceleration
      });
    }
  }, {
    key: 'disableAngularMotor',
    value: function disableAngularMotor() {
      if (this.worldModule) this.worldModule.execute('slider_disableAngularMotor', { constraint: this.id });
    }
  }]);
  return SliderConstraint;
}();

var DOFConstraint = function () {
  function DOFConstraint(obja, objb, position) {
    classCallCheck(this, DOFConstraint);

    var objecta = obja;
    var objectb = objb;

    if (position === undefined) {
      position = objectb;
      objectb = undefined;
    }

    this.type = 'dof';
    this.appliedImpulse = 0;
    this.worldModule = null; // Will be redefined by .addConstraint
    this.objecta = objecta.use('physics').data.id;
    this.positiona = convertWorldPositionToObject(position, objecta).clone();
    this.axisa = { x: objecta.rotation.x, y: objecta.rotation.y, z: objecta.rotation.z };

    if (objectb) {
      this.objectb = objectb.use('physics').data.id;
      this.positionb = convertWorldPositionToObject(position, objectb).clone();
      this.axisb = { x: objectb.rotation.x, y: objectb.rotation.y, z: objectb.rotation.z };
    }
  }

  createClass(DOFConstraint, [{
    key: 'getDefinition',
    value: function getDefinition() {
      return {
        type: this.type,
        id: this.id,
        objecta: this.objecta,
        objectb: this.objectb,
        positiona: this.positiona,
        positionb: this.positionb,
        axisa: this.axisa,
        axisb: this.axisb
      };
    }
  }, {
    key: 'setLinearLowerLimit',
    value: function setLinearLowerLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setLinearLowerLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setLinearUpperLimit',
    value: function setLinearUpperLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setLinearUpperLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setAngularLowerLimit',
    value: function setAngularLowerLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setAngularLowerLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'setAngularUpperLimit',
    value: function setAngularUpperLimit(limit) {
      if (this.worldModule) this.worldModule.execute('dof_setAngularUpperLimit', { constraint: this.id, x: limit.x, y: limit.y, z: limit.z });
    }
  }, {
    key: 'enableAngularMotor',
    value: function enableAngularMotor(which) {
      if (this.worldModule) this.worldModule.execute('dof_enableAngularMotor', { constraint: this.id, which: which });
    }
  }, {
    key: 'configureAngularMotor',
    value: function configureAngularMotor(which, low_angle, high_angle, velocity, max_force) {
      if (this.worldModule) this.worldModule.execute('dof_configureAngularMotor', { constraint: this.id, which: which, low_angle: low_angle, high_angle: high_angle, velocity: velocity, max_force: max_force });
    }
  }, {
    key: 'disableAngularMotor',
    value: function disableAngularMotor(which) {
      if (this.worldModule) this.worldModule.execute('dof_disableAngularMotor', { constraint: this.id, which: which });
    }
  }]);
  return DOFConstraint;
}();

var Vehicle = function () {
  function Vehicle(mesh) {
    var tuning = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : new VehicleTuning();
    classCallCheck(this, Vehicle);

    this.mesh = mesh;
    this.wheels = [];

    this._physijs = {
      id: getObjectId(),
      rigidBody: mesh._physijs.id,
      suspension_stiffness: tuning.suspension_stiffness,
      suspension_compression: tuning.suspension_compression,
      suspension_damping: tuning.suspension_damping,
      max_suspension_travel: tuning.max_suspension_travel,
      friction_slip: tuning.friction_slip,
      max_suspension_force: tuning.max_suspension_force
    };
  }

  createClass(Vehicle, [{
    key: 'addWheel',
    value: function addWheel(wheel_geometry, wheel_material, connection_point, wheel_direction, wheel_axle, suspension_rest_length, wheel_radius, is_front_wheel, tuning) {
      var wheel = new Mesh(wheel_geometry, wheel_material);

      wheel.castShadow = wheel.receiveShadow = true;
      wheel.position.copy(wheel_direction).multiplyScalar(suspension_rest_length / 100).add(connection_point);

      this.world.add(wheel);
      this.wheels.push(wheel);

      this.world.execute('addWheel', {
        id: this._physijs.id,
        connection_point: { x: connection_point.x, y: connection_point.y, z: connection_point.z },
        wheel_direction: { x: wheel_direction.x, y: wheel_direction.y, z: wheel_direction.z },
        wheel_axle: { x: wheel_axle.x, y: wheel_axle.y, z: wheel_axle.z },
        suspension_rest_length: suspension_rest_length,
        wheel_radius: wheel_radius,
        is_front_wheel: is_front_wheel,
        tuning: tuning
      });
    }
  }, {
    key: 'setSteering',
    value: function setSteering(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('setSteering', { id: this._physijs.id, wheel: wheel, steering: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('setSteering', { id: this._physijs.id, wheel: i, steering: amount });
        }
      }
    }
  }, {
    key: 'setBrake',
    value: function setBrake(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('setBrake', { id: this._physijs.id, wheel: wheel, brake: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('setBrake', { id: this._physijs.id, wheel: i, brake: amount });
        }
      }
    }
  }, {
    key: 'applyEngineForce',
    value: function applyEngineForce(amount, wheel) {
      if (wheel !== undefined && this.wheels[wheel] !== undefined) this.world.execute('applyEngineForce', { id: this._physijs.id, wheel: wheel, force: amount });else if (this.wheels.length > 0) {
        for (var i = 0; i < this.wheels.length; i++) {
          this.world.execute('applyEngineForce', { id: this._physijs.id, wheel: i, force: amount });
        }
      }
    }
  }]);
  return Vehicle;
}();

var _class, _temp2;

var WorldModuleBase = (_temp2 = _class = function (_Eventable) {
  inherits(WorldModuleBase, _Eventable);

  function WorldModuleBase(options) {
    classCallCheck(this, WorldModuleBase);

    var _this = possibleConstructorReturn(this, (WorldModuleBase.__proto__ || Object.getPrototypeOf(WorldModuleBase)).call(this));

    _this.bridge = {
      onAdd: function onAdd(component, self) {
        if (component.use('physics')) return self.defer(self.onAddCallback.bind(self), [component]);
        return;
      },
      onRemove: function onRemove(component, self) {
        if (component.use('physics')) return self.defer(self.onRemoveCallback.bind(self), [component]);
        return;
      }
    };


    _this.options = Object.assign(WorldModuleBase.defaults, options);

    _this.objects = {};
    _this.vehicles = {};
    _this.constraints = {};
    _this.isSimulating = false;

    _this.getObjectId = function () {
      var id = 1;
      return function () {
        return id++;
      };
    }();
    return _this;
  }

  createClass(WorldModuleBase, [{
    key: 'setup',
    value: function setup() {
      var _this2 = this;

      this.receive(function (event) {
        var _temp = void 0,
            data = event.data;

        if (data instanceof ArrayBuffer && data.byteLength !== 1) // byteLength === 1 is the worker making a SUPPORT_TRANSFERABLE test
          data = new Float32Array(data);

        if (data instanceof Float32Array) {
          // transferable object
          switch (data[0]) {
            case MESSAGE_TYPES.WORLDREPORT:
              _this2.updateScene(data);
              break;

            case MESSAGE_TYPES.SOFTREPORT:
              _this2.updateSoftbodies(data);
              break;

            case MESSAGE_TYPES.COLLISIONREPORT:
              _this2.updateCollisions(data);
              break;

            case MESSAGE_TYPES.VEHICLEREPORT:
              _this2.updateVehicles(data);
              break;

            case MESSAGE_TYPES.CONSTRAINTREPORT:
              _this2.updateConstraints(data);
              break;
            default:
          }
        } else if (data.cmd) {
          // non-transferable object
          switch (data.cmd) {
            case 'objectReady':
              _temp = data.params;
              if (_this2.objects[_temp]) _this2.objects[_temp].dispatchEvent('ready');
              break;

            case 'worldReady':
              _this2.dispatchEvent('ready');
              break;

            case 'ammoLoaded':
              _this2.dispatchEvent('loaded');
              // console.log("Physics loading time: " + (performance.now() - start) + "ms");
              break;

            case 'vehicle':
              window.test = data;
              break;

            default:
              // Do nothing, just show the message
              console.debug('Received: ' + data.cmd);
              console.dir(data.params);
              break;
          }
        } else {
          switch (data[0]) {
            case MESSAGE_TYPES.WORLDREPORT:
              _this2.updateScene(data);
              break;

            case MESSAGE_TYPES.COLLISIONREPORT:
              _this2.updateCollisions(data);
              break;

            case MESSAGE_TYPES.VEHICLEREPORT:
              _this2.updateVehicles(data);
              break;

            case MESSAGE_TYPES.CONSTRAINTREPORT:
              _this2.updateConstraints(data);
              break;
            default:
          }
        }
      });
    }
  }, {
    key: 'updateScene',
    value: function updateScene(info) {
      var index = info[1];

      while (index--) {
        var offset = 2 + index * REPORT_ITEMSIZE;
        var object = this.objects[info[offset]];
        var component = object.component;
        var data = component.use('physics').data;

        if (object === null) continue;

        if (component.__dirtyPosition === false) {
          object.position.set(info[offset + 1], info[offset + 2], info[offset + 3]);

          component.__dirtyPosition = false;
        }

        if (component.__dirtyRotation === false) {
          object.quaternion.set(info[offset + 4], info[offset + 5], info[offset + 6], info[offset + 7]);

          component.__dirtyRotation = false;
        }

        data.linearVelocity.set(info[offset + 8], info[offset + 9], info[offset + 10]);

        data.angularVelocity.set(info[offset + 11], info[offset + 12], info[offset + 13]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker

      this.isSimulating = false;
      this.dispatchEvent('update');
    }
  }, {
    key: 'updateSoftbodies',
    value: function updateSoftbodies(info) {
      var index = info[1],
          offset = 2;

      while (index--) {
        var size = info[offset + 1];
        var object = this.objects[info[offset]];

        if (object === null) continue;

        var data = object.component.use('physics').data;

        var attributes = object.geometry.attributes;
        var volumePositions = attributes.position.array;

        var offsetVert = offset + 2;

        // console.log(data.id);
        if (!data.isSoftBodyReset) {
          object.position.set(0, 0, 0);
          object.quaternion.set(0, 0, 0, 0);

          data.isSoftBodyReset = true;
        }

        if (data.type === "softTrimesh") {
          var volumeNormals = attributes.normal.array;

          for (var i = 0; i < size; i++) {
            var offs = offsetVert + i * 18;

            var x1 = info[offs];
            var y1 = info[offs + 1];
            var z1 = info[offs + 2];

            var nx1 = info[offs + 3];
            var ny1 = info[offs + 4];
            var nz1 = info[offs + 5];

            var x2 = info[offs + 6];
            var y2 = info[offs + 7];
            var z2 = info[offs + 8];

            var nx2 = info[offs + 9];
            var ny2 = info[offs + 10];
            var nz2 = info[offs + 11];

            var x3 = info[offs + 12];
            var y3 = info[offs + 13];
            var z3 = info[offs + 14];

            var nx3 = info[offs + 15];
            var ny3 = info[offs + 16];
            var nz3 = info[offs + 17];

            var i9 = i * 9;

            volumePositions[i9] = x1;
            volumePositions[i9 + 1] = y1;
            volumePositions[i9 + 2] = z1;

            volumePositions[i9 + 3] = x2;
            volumePositions[i9 + 4] = y2;
            volumePositions[i9 + 5] = z2;

            volumePositions[i9 + 6] = x3;
            volumePositions[i9 + 7] = y3;
            volumePositions[i9 + 8] = z3;

            volumeNormals[i9] = nx1;
            volumeNormals[i9 + 1] = ny1;
            volumeNormals[i9 + 2] = nz1;

            volumeNormals[i9 + 3] = nx2;
            volumeNormals[i9 + 4] = ny2;
            volumeNormals[i9 + 5] = nz2;

            volumeNormals[i9 + 6] = nx3;
            volumeNormals[i9 + 7] = ny3;
            volumeNormals[i9 + 8] = nz3;
          }

          attributes.normal.needsUpdate = true;
          offset += 2 + size * 18;
        } else if (data.type === "softRopeMesh") {
          for (var _i = 0; _i < size; _i++) {
            var _offs = offsetVert + _i * 3;

            var x = info[_offs];
            var y = info[_offs + 1];
            var z = info[_offs + 2];

            volumePositions[_i * 3] = x;
            volumePositions[_i * 3 + 1] = y;
            volumePositions[_i * 3 + 2] = z;
          }

          offset += 2 + size * 3;
        } else {
          var _volumeNormals = attributes.normal.array;

          for (var _i2 = 0; _i2 < size; _i2++) {
            var _offs2 = offsetVert + _i2 * 6;

            var _x = info[_offs2];
            var _y = info[_offs2 + 1];
            var _z = info[_offs2 + 2];

            var nx = info[_offs2 + 3];
            var ny = info[_offs2 + 4];
            var nz = info[_offs2 + 5];

            volumePositions[_i2 * 3] = _x;
            volumePositions[_i2 * 3 + 1] = _y;
            volumePositions[_i2 * 3 + 2] = _z;

            // FIXME: Normals are pointed to look inside;
            _volumeNormals[_i2 * 3] = nx;
            _volumeNormals[_i2 * 3 + 1] = ny;
            _volumeNormals[_i2 * 3 + 2] = nz;
          }

          attributes.normal.needsUpdate = true;
          offset += 2 + size * 6;
        }

        attributes.position.needsUpdate = true;
      }

      // if (this.SUPPORT_TRANSFERABLE)
      //   this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker

      this.isSimulating = false;
    }
  }, {
    key: 'updateVehicles',
    value: function updateVehicles(data) {
      var vehicle = void 0,
          wheel = void 0;

      for (var i = 0; i < (data.length - 1) / VEHICLEREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * VEHICLEREPORT_ITEMSIZE;
        vehicle = this.vehicles[data[offset]];

        if (vehicle === null) continue;

        wheel = vehicle.wheels[data[offset + 1]];

        wheel.position.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        wheel.quaternion.set(data[offset + 5], data[offset + 6], data[offset + 7], data[offset + 8]);
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateConstraints',
    value: function updateConstraints(data) {
      var constraint = void 0,
          object = void 0;

      for (var i = 0; i < (data.length - 1) / CONSTRAINTREPORT_ITEMSIZE; i++) {
        var offset = 1 + i * CONSTRAINTREPORT_ITEMSIZE;
        constraint = this.constraints[data[offset]];
        object = this.objects[data[offset + 1]];

        if (constraint === undefined || object === undefined) continue;

        temp1Vector3.set(data[offset + 2], data[offset + 3], data[offset + 4]);

        temp1Matrix4.extractRotation(object.matrix);
        temp1Vector3.applyMatrix4(temp1Matrix4);

        constraint.positiona.addVectors(object.position, temp1Vector3);
        constraint.appliedImpulse = data[offset + 5];
      }

      if (this.SUPPORT_TRANSFERABLE) this.send(data.buffer, [data.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'updateCollisions',
    value: function updateCollisions(info) {
      /**
       * #TODO
       * This is probably the worst way ever to handle collisions. The inherent evilness is a residual
       * effect from the previous version's evilness which mutated when switching to transferable objects.
       *
       * If you feel inclined to make this better, please do so.
       */

      var collisions = {},
          normal_offsets = {};

      // Build collision manifest
      for (var i = 0; i < info[1]; i++) {
        var offset = 2 + i * COLLISIONREPORT_ITEMSIZE;
        var object = info[offset];
        var object2 = info[offset + 1];

        normal_offsets[object + '-' + object2] = offset + 2;
        normal_offsets[object2 + '-' + object] = -1 * (offset + 2);

        // Register collisions for both the object colliding and the object being collided with
        if (!collisions[object]) collisions[object] = [];
        collisions[object].push(object2);

        if (!collisions[object2]) collisions[object2] = [];
        collisions[object2].push(object);
      }

      // Deal with collisions
      for (var id1 in this.objects) {
        if (!this.objects.hasOwnProperty(id1)) continue;
        var _object = this.objects[id1];
        var component = _object.component;
        var data = component.use('physics').data;

        if (_object === null) continue;

        // If object touches anything, ...
        if (collisions[id1]) {
          // Clean up touches array
          for (var j = 0; j < data.touches.length; j++) {
            if (collisions[id1].indexOf(data.touches[j]) === -1) data.touches.splice(j--, 1);
          }

          // Handle each colliding object
          for (var _j = 0; _j < collisions[id1].length; _j++) {
            var id2 = collisions[id1][_j];
            var _object2 = this.objects[id2];

            if (_object2) {
              var component2 = _object2.component;
              var data2 = component2.use('physics').data;
              // If object was not already touching object2, notify object
              if (data.touches.indexOf(id2) === -1) {
                data.touches.push(id2);

                var vel = component.use('physics').getLinearVelocity();
                var vel2 = component2.use('physics').getLinearVelocity();

                temp1Vector3.subVectors(vel, vel2);
                var temp1 = temp1Vector3.clone();

                temp1Vector3.subVectors(vel, vel2);
                var temp2 = temp1Vector3.clone();

                var normal_offset = normal_offsets[data.id + '-' + data2.id];

                if (normal_offset > 0) {
                  temp1Vector3.set(-info[normal_offset], -info[normal_offset + 1], -info[normal_offset + 2]);
                } else {
                  normal_offset *= -1;

                  temp1Vector3.set(info[normal_offset], info[normal_offset + 1], info[normal_offset + 2]);
                }

                component.emit('collision', _object2, temp1, temp2, temp1Vector3);
              }
            }
          }
        } else data.touches.length = 0; // not touching other objects
      }

      this.collisions = collisions;

      if (this.SUPPORT_TRANSFERABLE) this.send(info.buffer, [info.buffer]); // Give the typed array back to the worker
    }
  }, {
    key: 'addConstraint',
    value: function addConstraint(constraint, show_marker) {
      constraint.id = this.getObjectId();
      this.constraints[constraint.id] = constraint;
      constraint.worldModule = this;
      this.execute('addConstraint', constraint.getDefinition());

      if (show_marker) {
        var marker = void 0;

        switch (constraint.type) {
          case 'point':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'hinge':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'slider':
            marker = new Mesh(new BoxGeometry(10, 1, 1), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);

            // This rotation isn't right if all three axis are non-0 values
            // TODO: change marker's rotation order to ZYX
            marker.rotation.set(constraint.axis.y, // yes, y and
            constraint.axis.x, // x axis are swapped
            constraint.axis.z);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'conetwist':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;

          case 'dof':
            marker = new Mesh(new SphereGeometry(1.5), new MeshNormalMaterial());

            marker.position.copy(constraint.positiona);
            this.objects[constraint.objecta].add(marker);
            break;
          default:
        }
      }

      return constraint;
    }
  }, {
    key: 'onSimulationResume',
    value: function onSimulationResume() {
      this.execute('onSimulationResume', {});
    }
  }, {
    key: 'removeConstraint',
    value: function removeConstraint(constraint) {
      if (this.constraints[constraint.id] !== undefined) {
        this.execute('removeConstraint', { id: constraint.id });
        delete this.constraints[constraint.id];
      }
    }
  }, {
    key: 'execute',
    value: function execute(cmd, params) {
      this.send({ cmd: cmd, params: params });
    }
  }, {
    key: 'onAddCallback',
    value: function onAddCallback(component) {
      var object = component.native;
      var data = object.component.use('physics').data;

      if (data) {
        component.manager.set('module:world', this);
        data.id = this.getObjectId();
        object.component.use('physics').data = data;

        if (object instanceof Vehicle) {
          this.onAddCallback(object.mesh);
          this.vehicles[data.id] = object;
          this.execute('addVehicle', data);
        } else {
          component.__dirtyPosition = false;
          component.__dirtyRotation = false;
          this.objects[data.id] = object;

          if (object.children.length) {
            data.children = [];
            addObjectChildren(object, object);
          }

          // object.quaternion.setFromEuler(object.rotation);
          //
          // console.log(object.component);
          // console.log(object.rotation);

          // Object starting position + rotation
          data.position = {
            x: object.position.x,
            y: object.position.y,
            z: object.position.z
          };

          data.rotation = {
            x: object.quaternion.x,
            y: object.quaternion.y,
            z: object.quaternion.z,
            w: object.quaternion.w
          };

          if (data.width) data.width *= object.scale.x;
          if (data.height) data.height *= object.scale.y;
          if (data.depth) data.depth *= object.scale.z;

          this.execute('addObject', data);
        }

        component.emit('physics:added');
      }
    }
  }, {
    key: 'onRemoveCallback',
    value: function onRemoveCallback(component) {
      var object = component.native;

      if (object instanceof Vehicle) {
        this.execute('removeVehicle', { id: object._physijs.id });
        while (object.wheels.length) {
          this.remove(object.wheels.pop());
        }this.remove(object.mesh);
        this.vehicles[object._physijs.id] = null;
      } else {
        // Mesh.prototype.remove.call(this, object);

        if (object._physijs) {
          component.manager.remove('module:world');
          this.objects[object._physijs.id] = null;
          this.execute('removeObject', { id: object._physijs.id });
        }
      }
    }
  }, {
    key: 'defer',
    value: function defer(func, args) {
      var _this3 = this;

      return new Promise(function (resolve) {
        if (_this3.isLoaded) {
          func.apply(undefined, toConsumableArray(args));
          resolve();
        } else _this3.loader.then(function () {
          func.apply(undefined, toConsumableArray(args));
          resolve();
        });
      });
    }
  }, {
    key: 'manager',
    value: function manager(_manager) {
      _manager.define('physics');
      _manager.set('physicsWorker', this.worker);
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var _this4 = this;

      // ...

      this.setFixedTimeStep = function (fixedTimeStep) {
        if (fixedTimeStep) self.execute('setFixedTimeStep', fixedTimeStep);
      };

      this.setGravity = function (gravity) {
        if (gravity) self.execute('setGravity', gravity);
      };

      this.addConstraint = self.addConstraint.bind(self);

      this.simulate = function (timeStep, maxSubSteps) {
        if (self._stats) self._stats.begin();

        if (self.isSimulating) return false;
        self.isSimulating = true;

        for (var object_id in self.objects) {
          if (!self.objects.hasOwnProperty(object_id)) continue;

          var object = self.objects[object_id];
          var component = object.component;
          var data = component.use('physics').data;

          if (object !== null && (component.__dirtyPosition || component.__dirtyRotation)) {
            var update = { id: data.id };

            if (component.__dirtyPosition) {
              update.pos = {
                x: object.position.x,
                y: object.position.y,
                z: object.position.z
              };

              if (data.isSoftbody) object.position.set(0, 0, 0);

              component.__dirtyPosition = false;
            }

            if (component.__dirtyRotation) {
              update.quat = {
                x: object.quaternion.x,
                y: object.quaternion.y,
                z: object.quaternion.z,
                w: object.quaternion.w
              };

              if (data.isSoftbody) object.rotation.set(0, 0, 0);

              component.__dirtyRotation = false;
            }

            self.execute('updateTransform', update);
          }
        }

        self.execute('simulate', { timeStep: timeStep, maxSubSteps: maxSubSteps });

        if (self._stats) self._stats.end();
        return true;
      };

      // const simulateProcess = (t) => {
      //   window.requestAnimationFrame(simulateProcess);

      //   this.simulate(1/60, 1); // delta, 1
      // }

      // simulateProcess();

      self.loader.then(function () {
        self.simulateLoop = new Loop(function (clock) {
          _this4.simulate(clock.getDelta(), 1); // delta, 1
        });

        self.simulateLoop.start(_this4);

        console.log(self.options.gravity);
        _this4.setGravity(self.options.gravity);
      });
    }
  }]);
  return WorldModuleBase;
}(Eventable), _class.defaults = {
  fixedTimeStep: 1 / 60,
  rateLimit: true,
  ammo: "",
  softbody: false,
  gravity: new Vector3$1(0, 100, 0)
}, _temp2);

var TARGET = typeof Symbol === 'undefined' ? '__target' : Symbol(),
    SCRIPT_TYPE = 'application/javascript',
    BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder,
    URL = window.URL || window.webkitURL,
    Worker = window.Worker;

/**
 * Returns a wrapper around Web Worker code that is constructible.
 *
 * @function shimWorker
 *
 * @param { String }    filename    The name of the file
 * @param { Function }  fn          Function wrapping the code of the worker
 */
function shimWorker(filename, fn) {
    return function ShimWorker(forceFallback) {
        var o = this;

        if (!fn) {
            return new Worker(filename);
        } else if (Worker && !forceFallback) {
            // Convert the function's inner code to a string to construct the worker
            var source = fn.toString().replace(/^function.+?{/, '').slice(0, -1),
                objURL = createSourceObject(source);

            this[TARGET] = new Worker(objURL);
            URL.revokeObjectURL(objURL);
            return this[TARGET];
        } else {
            var selfShim = {
                postMessage: function postMessage(m) {
                    if (o.onmessage) {
                        setTimeout(function () {
                            o.onmessage({ data: m, target: selfShim });
                        });
                    }
                }
            };

            fn.call(selfShim);
            this.postMessage = function (m) {
                setTimeout(function () {
                    selfShim.onmessage({ data: m, target: o });
                });
            };
            this.isThisThread = true;
        }
    };
}
// Test Worker capabilities
if (Worker) {
    var testWorker,
        objURL = createSourceObject('self.onmessage = function () {}'),
        testArray = new Uint8Array(1);

    try {
        // No workers via blobs in Edge 12 and IE 11 and lower :(
        if (/(?:Trident|Edge)\/(?:[567]|12)/i.test(navigator.userAgent)) {
            throw new Error('Not available');
        }
        testWorker = new Worker(objURL);

        // Native browser on some Samsung devices throws for transferables, let's detect it
        testWorker.postMessage(testArray, [testArray.buffer]);
    } catch (e) {
        Worker = null;
    } finally {
        URL.revokeObjectURL(objURL);
        if (testWorker) {
            testWorker.terminate();
        }
    }
}

function createSourceObject(str) {
    try {
        return URL.createObjectURL(new Blob([str], { type: SCRIPT_TYPE }));
    } catch (e) {
        var blob = new BlobBuilder();
        blob.append(str);
        return URL.createObjectURL(blob.getBlob(type));
    }
}

var PhysicsWorker = new shimWorker("../worker.js", function (window, document) {
  var self = this;
  function Events(target) {
    var events = {},
        empty = [];
    target = target || this;
    /**
     *  On: listen to events
     */
    target.on = function (type, func, ctx) {
      (events[type] = events[type] || []).push([func, ctx]);
      return target;
    };
    /**
     *  Off: stop listening to event / specific callback
     */
    target.off = function (type, func) {
      type || (events = {});
      var list = events[type] || empty,
          i = list.length = func ? list.length : 0;
      while (i--) {
        func == list[i][0] && list.splice(i, 1);
      }return target;
    };
    /**
     * Emit: send event, callbacks will be triggered
     */
    target.emit = function (type) {
      var e = events[type] || empty,
          list = e.length > 0 ? e.slice(0, e.length) : e,
          i = 0,
          j;
      while (j = list[i++]) {
        j[0].apply(j[1], empty.slice.call(arguments, 1));
      }return target;
    };
  }
  var insideWorker = !self.document;
  if (!insideWorker) self = new Events();

  var send = insideWorker ? self.webkitPostMessage || self.postMessage : function (data) {
    self.emit('message', { data: data });
  };

  self.send = send;

  var SUPPORT_TRANSFERABLE = void 0;

  if (insideWorker) {
    var ab = new ArrayBuffer(1);

    send(ab, [ab]);
    SUPPORT_TRANSFERABLE = ab.byteLength === 0;
  }

  var MESSAGE_TYPES = {
    WORLDREPORT: 0,
    COLLISIONREPORT: 1,
    VEHICLEREPORT: 2,
    CONSTRAINTREPORT: 3,
    SOFTREPORT: 4
  };

  // temp variables
  var _object = void 0,
      _vector = void 0,
      _transform = void 0,
      _transform_pos = void 0,
      _softbody_enabled = false,
      _num_objects = 0,
      _num_rigidbody_objects = 0,
      _num_softbody_objects = 0,
      _num_wheels = 0,
      _num_constraints = 0,
      _softbody_report_size = 0,


  // world variables
  fixedTimeStep = void 0,
      world = void 0,
      _vec3_1 = void 0,
      _vec3_2 = void 0,
      _vec3_3 = void 0,
      _quat = void 0;

  // private cache
  var public_functions = {},
      _objects = [],
      _vehicles = [],
      _constraints = [],
      _objects_ammo = {},
      _object_shapes = {},


  // The following objects are to track objects that ammo.js doesn't clean
  // up. All are cleaned up when they're corresponding body is destroyed.
  // Unfortunately, it's very difficult to get at these objects from the
  // body, so we have to track them ourselves.
  _motion_states = {},

  // Don't need to worry about it for cached shapes.
  _noncached_shapes = {},

  // A body with a compound shape always has a regular shape as well, so we
  // have track them separately.
  _compound_shapes = {};

  // object reporting
  var REPORT_CHUNKSIZE = void 0,
      // report array is increased in increments of this chunk size
  worldreport = void 0,
      softreport = void 0,
      collisionreport = void 0,
      vehiclereport = void 0,
      constraintreport = void 0;

  var WORLDREPORT_ITEMSIZE = 14,
      // how many float values each reported item needs
  COLLISIONREPORT_ITEMSIZE = 5,
      // one float for each object id, and a Vec3 contact normal
  VEHICLEREPORT_ITEMSIZE = 9,
      // vehicle id, wheel index, 3 for position, 4 for rotation
  CONSTRAINTREPORT_ITEMSIZE = 6; // constraint id, offset object, offset, applied impulse

  var getShapeFromCache = function getShapeFromCache(cache_key) {
    if (_object_shapes[cache_key] !== undefined) return _object_shapes[cache_key];

    return null;
  };

  var setShapeCache = function setShapeCache(cache_key, shape) {
    _object_shapes[cache_key] = shape;
  };

  var createShape = function createShape(description) {
    var shape = void 0;

    _transform.setIdentity();
    switch (description.type) {
      case 'compound':
        {
          shape = new Ammo.btCompoundShape();

          break;
        }
      case 'plane':
        {
          var cache_key = 'plane_' + description.normal.x + '_' + description.normal.y + '_' + description.normal.z;

          if ((shape = getShapeFromCache(cache_key)) === null) {
            _vec3_1.setX(description.normal.x);
            _vec3_1.setY(description.normal.y);
            _vec3_1.setZ(description.normal.z);
            shape = new Ammo.btStaticPlaneShape(_vec3_1, 0);
            setShapeCache(cache_key, shape);
          }

          break;
        }
      case 'box':
        {
          var _cache_key = 'box_' + description.width + '_' + description.height + '_' + description.depth;

          if ((shape = getShapeFromCache(_cache_key)) === null) {
            _vec3_1.setX(description.width / 2);
            _vec3_1.setY(description.height / 2);
            _vec3_1.setZ(description.depth / 2);
            shape = new Ammo.btBoxShape(_vec3_1);
            setShapeCache(_cache_key, shape);
          }

          break;
        }
      case 'sphere':
        {
          var _cache_key2 = 'sphere_' + description.radius;

          if ((shape = getShapeFromCache(_cache_key2)) === null) {
            shape = new Ammo.btSphereShape(description.radius);
            setShapeCache(_cache_key2, shape);
          }

          break;
        }
      case 'cylinder':
        {
          var _cache_key3 = 'cylinder_' + description.width + '_' + description.height + '_' + description.depth;

          if ((shape = getShapeFromCache(_cache_key3)) === null) {
            _vec3_1.setX(description.width / 2);
            _vec3_1.setY(description.height / 2);
            _vec3_1.setZ(description.depth / 2);
            shape = new Ammo.btCylinderShape(_vec3_1);
            setShapeCache(_cache_key3, shape);
          }

          break;
        }
      case 'capsule':
        {
          var _cache_key4 = 'capsule_' + description.radius + '_' + description.height;

          if ((shape = getShapeFromCache(_cache_key4)) === null) {
            // In Bullet, capsule height excludes the end spheres
            shape = new Ammo.btCapsuleShape(description.radius, description.height - 2 * description.radius);
            setShapeCache(_cache_key4, shape);
          }

          break;
        }
      case 'cone':
        {
          var _cache_key5 = 'cone_' + description.radius + '_' + description.height;

          if ((shape = getShapeFromCache(_cache_key5)) === null) {
            shape = new Ammo.btConeShape(description.radius, description.height);
            setShapeCache(_cache_key5, shape);
          }

          break;
        }
      case 'concave':
        {
          var triangle_mesh = new Ammo.btTriangleMesh();
          if (!description.data.length) return false;
          var data = description.data;

          for (var i = 0; i < data.length / 9; i++) {
            _vec3_1.setX(data[i * 9]);
            _vec3_1.setY(data[i * 9 + 1]);
            _vec3_1.setZ(data[i * 9 + 2]);

            _vec3_2.setX(data[i * 9 + 3]);
            _vec3_2.setY(data[i * 9 + 4]);
            _vec3_2.setZ(data[i * 9 + 5]);

            _vec3_3.setX(data[i * 9 + 6]);
            _vec3_3.setY(data[i * 9 + 7]);
            _vec3_3.setZ(data[i * 9 + 8]);

            triangle_mesh.addTriangle(_vec3_1, _vec3_2, _vec3_3, false);
          }

          shape = new Ammo.btBvhTriangleMeshShape(triangle_mesh, true, true);

          _noncached_shapes[description.id] = shape;

          break;
        }
      case 'convex':
        {
          shape = new Ammo.btConvexHullShape();
          var _data = description.data;

          for (var _i = 0; _i < _data.length / 3; _i++) {
            _vec3_1.setX(_data[_i * 3]);
            _vec3_1.setY(_data[_i * 3 + 1]);
            _vec3_1.setZ(_data[_i * 3 + 2]);

            shape.addPoint(_vec3_1);
          }

          _noncached_shapes[description.id] = shape;

          break;
        }
      case 'heightfield':
        {
          var xpts = description.xpts,
              ypts = description.ypts,
              points = description.points,
              ptr = Ammo._malloc(4 * xpts * ypts);

          for (var _i2 = 0, p = 0, p2 = 0; _i2 < xpts; _i2++) {
            for (var j = 0; j < ypts; j++) {
              Ammo.HEAPF32[ptr + p2 >> 2] = points[p];

              p++;
              p2 += 4;
            }
          }

          shape = new Ammo.btHeightfieldTerrainShape(description.xpts, description.ypts, ptr, 1, -description.absMaxHeight, description.absMaxHeight, 1, 'PHY_FLOAT', false);

          _noncached_shapes[description.id] = shape;
          break;
        }
      default:
        // Not recognized
        return;
    }

    return shape;
  };

  var createSoftBody = function createSoftBody(description) {
    var body = void 0;

    var softBodyHelpers = new Ammo.btSoftBodyHelpers();

    switch (description.type) {
      case 'softTrimesh':
        {
          if (!description.aVertices.length) return false;

          body = softBodyHelpers.CreateFromTriMesh(world.getWorldInfo(), description.aVertices, description.aIndices, description.aIndices.length / 3, false);

          break;
        }
      case 'softClothMesh':
        {
          var cr = description.corners;

          body = softBodyHelpers.CreatePatch(world.getWorldInfo(), new Ammo.btVector3(cr[0], cr[1], cr[2]), new Ammo.btVector3(cr[3], cr[4], cr[5]), new Ammo.btVector3(cr[6], cr[7], cr[8]), new Ammo.btVector3(cr[9], cr[10], cr[11]), description.segments[0], description.segments[1], 0, true);

          break;
        }
      case 'softRopeMesh':
        {
          var data = description.data;

          body = softBodyHelpers.CreateRope(world.getWorldInfo(), new Ammo.btVector3(data[0], data[1], data[2]), new Ammo.btVector3(data[3], data[4], data[5]), data[6] - 1, 0);

          break;
        }
      default:
        // Not recognized
        return;
    }

    return body;
  };

  public_functions.init = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (params.noWorker) {
      window.Ammo = new params.ammo();
      public_functions.makeWorld(params);
      return;
    }

    if (params.wasmBuffer) {
      importScripts(params.ammo);

      self.Ammo = new loadAmmoFromBinary(params.wasmBuffer)();
      send({ cmd: 'ammoLoaded' });
      public_functions.makeWorld(params);
    } else {
      importScripts(params.ammo);
      send({ cmd: 'ammoLoaded' });

      self.Ammo = new Ammo();
      public_functions.makeWorld(params);
    }
  };

  public_functions.makeWorld = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    _transform = new Ammo.btTransform();
    _transform_pos = new Ammo.btTransform();
    _vec3_1 = new Ammo.btVector3(0, 0, 0);
    _vec3_2 = new Ammo.btVector3(0, 0, 0);
    _vec3_3 = new Ammo.btVector3(0, 0, 0);
    _quat = new Ammo.btQuaternion(0, 0, 0, 0);

    REPORT_CHUNKSIZE = params.reportsize || 50;

    if (SUPPORT_TRANSFERABLE) {
      // Transferable messages are supported, take advantage of them with TypedArrays
      worldreport = new Float32Array(2 + REPORT_CHUNKSIZE * WORLDREPORT_ITEMSIZE); // message id + # of objects to report + chunk size * # of values per object
      collisionreport = new Float32Array(2 + REPORT_CHUNKSIZE * COLLISIONREPORT_ITEMSIZE); // message id + # of collisions to report + chunk size * # of values per object
      vehiclereport = new Float32Array(2 + REPORT_CHUNKSIZE * VEHICLEREPORT_ITEMSIZE); // message id + # of vehicles to report + chunk size * # of values per object
      constraintreport = new Float32Array(2 + REPORT_CHUNKSIZE * CONSTRAINTREPORT_ITEMSIZE); // message id + # of constraints to report + chunk size * # of values per object
    } else {
      // Transferable messages are not supported, send data as normal arrays
      worldreport = [];
      collisionreport = [];
      vehiclereport = [];
      constraintreport = [];
    }

    worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
    collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
    vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
    constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;

    var collisionConfiguration = params.softbody ? new Ammo.btSoftBodyRigidBodyCollisionConfiguration() : new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    var broadphase = void 0;

    if (!params.broadphase) params.broadphase = { type: 'dynamic' };
    // TODO!!!
    /* if (params.broadphase.type === 'sweepprune') {
      extend(params.broadphase, {
        aabbmin: {
          x: -50,
          y: -50,
          z: -50
        },
         aabbmax: {
          x: 50,
          y: 50,
          z: 50
        },
      });
    }*/

    switch (params.broadphase.type) {
      case 'sweepprune':
        _vec3_1.setX(params.broadphase.aabbmin.x);
        _vec3_1.setY(params.broadphase.aabbmin.y);
        _vec3_1.setZ(params.broadphase.aabbmin.z);

        _vec3_2.setX(params.broadphase.aabbmax.x);
        _vec3_2.setY(params.broadphase.aabbmax.y);
        _vec3_2.setZ(params.broadphase.aabbmax.z);

        broadphase = new Ammo.btAxisSweep3(_vec3_1, _vec3_2);

        break;
      case 'dynamic':
      default:
        broadphase = new Ammo.btDbvtBroadphase();
        break;
    }

    world = params.softbody ? new Ammo.btSoftRigidDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration, new Ammo.btDefaultSoftBodySolver()) : new Ammo.btDiscreteDynamicsWorld(dispatcher, broadphase, solver, collisionConfiguration);
    fixedTimeStep = params.fixedTimeStep;

    if (params.softbody) _softbody_enabled = true;

    send({ cmd: 'worldReady' });
  };

  public_functions.setFixedTimeStep = function (description) {
    fixedTimeStep = description;
  };

  public_functions.setGravity = function (description) {
    _vec3_1.setX(description.x);
    _vec3_1.setY(description.y);
    _vec3_1.setZ(description.z);
    world.setGravity(_vec3_1);
  };

  public_functions.appendAnchor = function (description) {
    _objects[description.obj].appendAnchor(description.node, _objects[description.obj2], description.collisionBetweenLinkedBodies, description.influence);
  };

  public_functions.linkNodes = function (description) {
    var self_body = _objects[description.self];
    var other_body = _objects[description.body];

    var self_node = self_body.get_m_nodes().at(description.n1);
    var other_node = other_body.get_m_nodes().at(description.n2);

    var self_vec = self_node.get_m_x();
    var other_vec = other_node.get_m_x();

    var force_x = other_vec.x() - self_vec.x();
    var force_y = other_vec.y() - self_vec.y();
    var force_z = other_vec.z() - self_vec.z();

    // var modifier = 30;

    var cached_distance = void 0,
        linked = false;

    var _loop = setInterval(function () {
      force_x = other_vec.x() - self_vec.x();
      force_y = other_vec.y() - self_vec.y();
      force_z = other_vec.z() - self_vec.z();

      var distance = Math.sqrt(force_x * force_x + force_y * force_y + force_z * force_z);

      if (cached_distance && !linked && cached_distance < distance) {
        // cached_distance && !linked && cached_distance < distance

        linked = true;

        // let self_vel = self_node.get_m_v();
        //
        // _vec3_1.setX(-self_vel.x());
        // _vec3_1.setY(-self_vel.y());
        // _vec3_1.setZ(-self_vel.z());
        //
        // let other_vel = other_node.get_m_v();
        //
        // _vec3_2.setX(-other_vel.x());
        // _vec3_2.setY(-other_vel.y());
        // _vec3_2.setZ(-other_vel.z());

        console.log('link!');

        _vec3_1.setX(0);
        _vec3_1.setY(0);
        _vec3_1.setZ(0);

        self_body.setVelocity(_vec3_1);

        other_body.setVelocity(_vec3_1);

        // self_body.addVelocity(_vec3_1);
        // other_body.addVelocity(_vec3_2);

        // self_relative_x = self_node.x();
        // self_relative_y = self_node.y();
        // self_relative_z = self_node.z();
        //
        // other_relative_x = other_node.x();
        // other_relative_y = other_node.y();
        // other_relative_z = other_node.z();

        // self_relative = new Ammo.btVector3();
        // self_relative.setX();

        // console.log('link!');
        // self_body.appendAnchor(description.n1, connector, true, 0.5);
        // other_body.appendAnchor(description.n2, connector, true, 0.5);
        // clearInterval(_loop);

        // _vec3_1.setX(0);
        // _vec3_1.setY(0);
        // _vec3_1.setZ(0);

        // self_body.setVelocity(_vec3_1);
        // other_body.setVelocity(_vec3_1);

        // other_body.addForce(
        //   _vec3_2,
        //   description.n2
        // );

        // description.modifier *= 1.6;
      }

      var modifer2 = linked ? 40 : 1;

      force_x *= Math.max(distance, 1) * description.modifier * modifer2;
      force_y *= Math.max(distance, 1) * description.modifier * modifer2;
      force_z *= Math.max(distance, 1) * description.modifier * modifer2;

      _vec3_1.setX(force_x);
      _vec3_1.setY(force_y);
      _vec3_1.setZ(force_z);

      _vec3_2.setX(-force_x);
      _vec3_2.setY(-force_y);
      _vec3_2.setZ(-force_z);

      self_body.addVelocity(_vec3_1, description.n1);

      other_body.addVelocity(_vec3_2, description.n2);

      // } else {
      //   // self_relative_x = null;
      // }


      // if (self_relative_x) {
      //   _vec3_1.setX(self_relative_x - self_node.x());
      //   _vec3_1.setY(self_relative_y - self_node.y());
      //   _vec3_1.setZ(self_relative_z - self_node.z());
      //
      //   _vec3_2.setX(other_relative_x - other_node.x());
      //   _vec3_2.setY(other_relative_y - other_node.y());
      //   _vec3_2.setZ(other_relative_z - other_node.z());
      // } else {

      // }


      cached_distance = distance;
    }, 10);
  };

  public_functions.appendLink = function (description) {
    // console.log(Ammo);
    // console.log(new Ammo.Material());

    // var _mat = new Ammo.Material();
    //
    // _mat.set_m_kAST(0);
    // _mat.set_m_kLST(0);
    // _mat.set_m_kVST(0);
    //
    // _objects[description.self].appendLink(
    //   description.n1,
    //   description.n2,
    //   _mat,
    //   false
    // );

    _vec3_1.setX(1000);
    _vec3_1.setY(0);
    _vec3_1.setZ(0);

    _objects[description.self].addForce(_vec3_1, description.n1);
  };

  public_functions.appendLinearJoint = function (description) {
    // console.log('Ammo', Ammo);
    var specs = new Ammo.Specs();
    var _pos = description.specs.position;

    specs.set_position(new Ammo.btVector3(_pos[0], _pos[1], _pos[2]));
    if (description.specs.erp) specs.set_erp(description.specs.erp);
    if (description.specs.cfm) specs.set_cfm(description.specs.cfm);
    if (description.specs.split) specs.set_split(description.specs.split);

    // console.log(specs);
    //
    // // ljoint.set_m_rpos(
    // //   new Ammo.btVector3(_pos1[0], _pos1[1], _pos1[2]),
    // //   new Ammo.btVector3(_pos2[0], _pos2[1], _pos2[2])
    // // );
    //
    // // console.log('ljoint', ljoint);
    //

    // console.log('body', _objects[description.body]);
    _objects[description.self].appendLinearJoint(specs, _objects[description.body]);
  };

  public_functions.addObject = function (description) {
    var body = void 0,
        motionState = void 0;

    if (description.type.indexOf('soft') !== -1) {
      body = createSoftBody(description);

      var sbConfig = body.get_m_cfg();

      if (description.viterations) sbConfig.set_viterations(description.viterations);
      if (description.piterations) sbConfig.set_piterations(description.piterations);
      if (description.diterations) sbConfig.set_diterations(description.diterations);
      if (description.citerations) sbConfig.set_citerations(description.citerations);
      sbConfig.set_collisions(0x11);
      sbConfig.set_kDF(description.friction);
      sbConfig.set_kDP(description.damping);
      if (description.pressure) sbConfig.set_kPR(description.pressure);
      if (description.drag) sbConfig.set_kDG(description.drag);
      if (description.lift) sbConfig.set_kLF(description.lift);
      if (description.anchorHardness) sbConfig.set_kAHR(description.anchorHardness);
      if (description.rigidHardness) sbConfig.set_kCHR(description.rigidHardness);

      if (description.klst) body.get_m_materials().at(0).set_m_kLST(description.klst);
      if (description.kast) body.get_m_materials().at(0).set_m_kAST(description.kast);
      if (description.kvst) body.get_m_materials().at(0).set_m_kVST(description.kvst);

      Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setMargin(typeof description.margin !== 'undefined' ? description.margin : 0.1);

      // Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setMargin(0);

      // Ammo.castObject(body, Ammo.btCollisionObject).getCollisionShape().setLocalScaling(_vec3_1);
      body.setActivationState(description.state || 4);
      body.type = 0; // SoftBody.
      if (description.type === 'softRopeMesh') body.rope = true;
      if (description.type === 'softClothMesh') body.cloth = true;

      _transform.setIdentity();

      // @test
      _quat.setX(description.rotation.x);
      _quat.setY(description.rotation.y);
      _quat.setZ(description.rotation.z);
      _quat.setW(description.rotation.w);
      body.rotate(_quat);

      _vec3_1.setX(description.position.x);
      _vec3_1.setY(description.position.y);
      _vec3_1.setZ(description.position.z);
      body.translate(_vec3_1);

      _vec3_1.setX(description.scale.x);
      _vec3_1.setY(description.scale.y);
      _vec3_1.setZ(description.scale.z);
      body.scale(_vec3_1);

      body.setTotalMass(description.mass, false);
      world.addSoftBody(body, 1, -1);
      if (description.type === 'softTrimesh') _softbody_report_size += body.get_m_faces().size() * 3;else if (description.type === 'softRopeMesh') _softbody_report_size += body.get_m_nodes().size();else _softbody_report_size += body.get_m_nodes().size() * 3;

      _num_softbody_objects++;
    } else {
      var shape = createShape(description);

      if (!shape) return;

      // If there are children then this is a compound shape
      if (description.children) {
        var compound_shape = new Ammo.btCompoundShape();
        compound_shape.addChildShape(_transform, shape);

        for (var i = 0; i < description.children.length; i++) {
          var _child = description.children[i];

          var trans = new Ammo.btTransform();
          trans.setIdentity();

          _vec3_1.setX(_child.position_offset.x);
          _vec3_1.setY(_child.position_offset.y);
          _vec3_1.setZ(_child.position_offset.z);
          trans.setOrigin(_vec3_1);

          _quat.setX(_child.rotation.x);
          _quat.setY(_child.rotation.y);
          _quat.setZ(_child.rotation.z);
          _quat.setW(_child.rotation.w);
          trans.setRotation(_quat);

          shape = createShape(description.children[i]);
          compound_shape.addChildShape(trans, shape);
          Ammo.destroy(trans);
        }

        shape = compound_shape;
        _compound_shapes[description.id] = shape;
      }

      _vec3_1.setX(description.scale.x);
      _vec3_1.setY(description.scale.y);
      _vec3_1.setZ(description.scale.z);

      shape.setLocalScaling(_vec3_1);
      shape.setMargin(typeof description.margin !== 'undefined' ? description.margin : 0);

      _vec3_1.setX(0);
      _vec3_1.setY(0);
      _vec3_1.setZ(0);
      shape.calculateLocalInertia(description.mass, _vec3_1);

      _transform.setIdentity();

      _vec3_2.setX(description.position.x);
      _vec3_2.setY(description.position.y);
      _vec3_2.setZ(description.position.z);
      _transform.setOrigin(_vec3_2);

      _quat.setX(description.rotation.x);
      _quat.setY(description.rotation.y);
      _quat.setZ(description.rotation.z);
      _quat.setW(description.rotation.w);
      _transform.setRotation(_quat);

      motionState = new Ammo.btDefaultMotionState(_transform); // #TODO: btDefaultMotionState supports center of mass offset as second argument - implement
      var rbInfo = new Ammo.btRigidBodyConstructionInfo(description.mass, motionState, shape, _vec3_1);

      rbInfo.set_m_friction(description.friction);
      rbInfo.set_m_restitution(description.restitution);
      rbInfo.set_m_linearDamping(description.damping);
      rbInfo.set_m_angularDamping(description.damping);

      body = new Ammo.btRigidBody(rbInfo);
      body.setActivationState(description.state || 4);
      Ammo.destroy(rbInfo);

      if (typeof description.collision_flags !== 'undefined') body.setCollisionFlags(description.collision_flags);

      if (description.group && description.mask) world.addRigidBody(body, description.group, description.mask);else world.addRigidBody(body);
      body.type = 1; // RigidBody.
      _num_rigidbody_objects++;
    }

    body.activate();

    body.id = description.id;
    _objects[body.id] = body;
    _motion_states[body.id] = motionState;

    _objects_ammo[body.a === undefined ? body.ptr : body.a] = body.id;
    _num_objects++;

    send({ cmd: 'objectReady', params: body.id });
  };

  public_functions.addVehicle = function (description) {
    var vehicle_tuning = new Ammo.btVehicleTuning();

    vehicle_tuning.set_m_suspensionStiffness(description.suspension_stiffness);
    vehicle_tuning.set_m_suspensionCompression(description.suspension_compression);
    vehicle_tuning.set_m_suspensionDamping(description.suspension_damping);
    vehicle_tuning.set_m_maxSuspensionTravelCm(description.max_suspension_travel);
    vehicle_tuning.set_m_maxSuspensionForce(description.max_suspension_force);

    var vehicle = new Ammo.btRaycastVehicle(vehicle_tuning, _objects[description.rigidBody], new Ammo.btDefaultVehicleRaycaster(world));

    vehicle.tuning = vehicle_tuning;
    _objects[description.rigidBody].setActivationState(4);
    vehicle.setCoordinateSystem(0, 1, 2);

    world.addVehicle(vehicle);
    _vehicles[description.id] = vehicle;
  };
  public_functions.removeVehicle = function (description) {
    _vehicles[description.id] = null;
  };

  public_functions.addWheel = function (description) {
    if (_vehicles[description.id] !== undefined) {
      var tuning = _vehicles[description.id].tuning;
      if (description.tuning !== undefined) {
        tuning = new Ammo.btVehicleTuning();
        tuning.set_m_suspensionStiffness(description.tuning.suspension_stiffness);
        tuning.set_m_suspensionCompression(description.tuning.suspension_compression);
        tuning.set_m_suspensionDamping(description.tuning.suspension_damping);
        tuning.set_m_maxSuspensionTravelCm(description.tuning.max_suspension_travel);
        tuning.set_m_maxSuspensionForce(description.tuning.max_suspension_force);
      }

      _vec3_1.setX(description.connection_point.x);
      _vec3_1.setY(description.connection_point.y);
      _vec3_1.setZ(description.connection_point.z);

      _vec3_2.setX(description.wheel_direction.x);
      _vec3_2.setY(description.wheel_direction.y);
      _vec3_2.setZ(description.wheel_direction.z);

      _vec3_3.setX(description.wheel_axle.x);
      _vec3_3.setY(description.wheel_axle.y);
      _vec3_3.setZ(description.wheel_axle.z);

      _vehicles[description.id].addWheel(_vec3_1, _vec3_2, _vec3_3, description.suspension_rest_length, description.wheel_radius, tuning, description.is_front_wheel);
    }

    _num_wheels++;

    if (SUPPORT_TRANSFERABLE) {
      vehiclereport = new Float32Array(1 + _num_wheels * VEHICLEREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
      vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
    } else vehiclereport = [MESSAGE_TYPES.VEHICLEREPORT];
  };

  public_functions.setSteering = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].setSteeringValue(details.steering, details.wheel);
  };

  public_functions.setBrake = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].setBrake(details.brake, details.wheel);
  };

  public_functions.applyEngineForce = function (details) {
    if (_vehicles[details.id] !== undefined) _vehicles[details.id].applyEngineForce(details.force, details.wheel);
  };

  public_functions.removeObject = function (details) {
    if (_objects[details.id].type === 0) {
      _num_softbody_objects--;
      _softbody_report_size -= _objects[details.id].get_m_nodes().size();
      world.removeSoftBody(_objects[details.id]);
    } else if (_objects[details.id].type === 1) {
      _num_rigidbody_objects--;
      world.removeRigidBody(_objects[details.id]);
      Ammo.destroy(_motion_states[details.id]);
    }

    Ammo.destroy(_objects[details.id]);
    if (_compound_shapes[details.id]) Ammo.destroy(_compound_shapes[details.id]);
    if (_noncached_shapes[details.id]) Ammo.destroy(_noncached_shapes[details.id]);

    _objects_ammo[_objects[details.id].a === undefined ? _objects[details.id].a : _objects[details.id].ptr] = null;
    _objects[details.id] = null;
    _motion_states[details.id] = null;

    if (_compound_shapes[details.id]) _compound_shapes[details.id] = null;
    if (_noncached_shapes[details.id]) _noncached_shapes[details.id] = null;
    _num_objects--;
  };

  public_functions.updateTransform = function (details) {
    _object = _objects[details.id];

    if (_object.type === 1) {
      _object.getMotionState().getWorldTransform(_transform);

      if (details.pos) {
        _vec3_1.setX(details.pos.x);
        _vec3_1.setY(details.pos.y);
        _vec3_1.setZ(details.pos.z);
        _transform.setOrigin(_vec3_1);
      }

      if (details.quat) {
        _quat.setX(details.quat.x);
        _quat.setY(details.quat.y);
        _quat.setZ(details.quat.z);
        _quat.setW(details.quat.w);
        _transform.setRotation(_quat);
      }

      _object.setWorldTransform(_transform);
      _object.activate();
    } else if (_object.type === 0) {
      // _object.getWorldTransform(_transform);

      if (details.pos) {
        _vec3_1.setX(details.pos.x);
        _vec3_1.setY(details.pos.y);
        _vec3_1.setZ(details.pos.z);
        _transform.setOrigin(_vec3_1);
      }

      if (details.quat) {
        _quat.setX(details.quat.x);
        _quat.setY(details.quat.y);
        _quat.setZ(details.quat.z);
        _quat.setW(details.quat.w);
        _transform.setRotation(_quat);
      }

      _object.transform(_transform);
    }
  };

  public_functions.updateMass = function (details) {
    // #TODO: changing a static object into dynamic is buggy
    _object = _objects[details.id];

    // Per http://www.bulletphysics.org/Bullet/phpBB3/viewtopic.php?p=&f=9&t=3663#p13816
    world.removeRigidBody(_object);

    _vec3_1.setX(0);
    _vec3_1.setY(0);
    _vec3_1.setZ(0);

    _object.setMassProps(details.mass, _vec3_1);
    world.addRigidBody(_object);
    _object.activate();
  };

  public_functions.applyCentralImpulse = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].applyCentralImpulse(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyImpulse = function (details) {
    _vec3_1.setX(details.impulse_x);
    _vec3_1.setY(details.impulse_y);
    _vec3_1.setZ(details.impulse_z);

    _vec3_2.setX(details.x);
    _vec3_2.setY(details.y);
    _vec3_2.setZ(details.z);

    _objects[details.id].applyImpulse(_vec3_1, _vec3_2);
    _objects[details.id].activate();
  };

  public_functions.applyTorque = function (details) {
    _vec3_1.setX(details.torque_x);
    _vec3_1.setY(details.torque_y);
    _vec3_1.setZ(details.torque_z);

    _objects[details.id].applyTorque(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyCentralForce = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].applyCentralForce(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.applyForce = function (details) {
    _vec3_1.setX(details.force_x);
    _vec3_1.setY(details.force_y);
    _vec3_1.setZ(details.force_z);

    _vec3_2.setX(details.x);
    _vec3_2.setY(details.y);
    _vec3_2.setZ(details.z);

    _objects[details.id].applyForce(_vec3_1, _vec3_2);
    _objects[details.id].activate();
  };

  public_functions.onSimulationResume = function () {
  };

  public_functions.setAngularVelocity = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setAngularVelocity(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.setLinearVelocity = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setLinearVelocity(_vec3_1);
    _objects[details.id].activate();
  };

  public_functions.setAngularFactor = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setAngularFactor(_vec3_1);
  };

  public_functions.setLinearFactor = function (details) {
    _vec3_1.setX(details.x);
    _vec3_1.setY(details.y);
    _vec3_1.setZ(details.z);

    _objects[details.id].setLinearFactor(_vec3_1);
  };

  public_functions.setDamping = function (details) {
    _objects[details.id].setDamping(details.linear, details.angular);
  };

  public_functions.setCcdMotionThreshold = function (details) {
    _objects[details.id].setCcdMotionThreshold(details.threshold);
  };

  public_functions.setCcdSweptSphereRadius = function (details) {
    _objects[details.id].setCcdSweptSphereRadius(details.radius);
  };

  public_functions.addConstraint = function (details) {
    var constraint = void 0;

    switch (details.type) {

      case 'point':
        {
          if (details.objectb === undefined) {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            constraint = new Ammo.btPoint2PointConstraint(_objects[details.objecta], _vec3_1);
          } else {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            constraint = new Ammo.btPoint2PointConstraint(_objects[details.objecta], _objects[details.objectb], _vec3_1, _vec3_2);
          }
          break;
        }
      case 'hinge':
        {
          if (details.objectb === undefined) {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.axis.x);
            _vec3_2.setY(details.axis.y);
            _vec3_2.setZ(details.axis.z);

            constraint = new Ammo.btHingeConstraint(_objects[details.objecta], _vec3_1, _vec3_2);
          } else {
            _vec3_1.setX(details.positiona.x);
            _vec3_1.setY(details.positiona.y);
            _vec3_1.setZ(details.positiona.z);

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            _vec3_3.setX(details.axis.x);
            _vec3_3.setY(details.axis.y);
            _vec3_3.setZ(details.axis.z);

            constraint = new Ammo.btHingeConstraint(_objects[details.objecta], _objects[details.objectb], _vec3_1, _vec3_2, _vec3_3, _vec3_3);
          }
          break;
        }
      case 'slider':
        {
          var transformb = void 0;
          var transforma = new Ammo.btTransform();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          transforma.setOrigin(_vec3_1);

          var rotation = transforma.getRotation();
          rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
          transforma.setRotation(rotation);

          if (details.objectb) {
            transformb = new Ammo.btTransform();

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            transformb.setOrigin(_vec3_2);

            rotation = transformb.getRotation();
            rotation.setEuler(details.axis.x, details.axis.y, details.axis.z);
            transformb.setRotation(rotation);

            constraint = new Ammo.btSliderConstraint(_objects[details.objecta], _objects[details.objectb], transforma, transformb, true);
          } else {
            constraint = new Ammo.btSliderConstraint(_objects[details.objecta], transforma, true);
          }

          constraint.ta = transforma;
          constraint.tb = transformb;

          Ammo.destroy(transforma);
          if (transformb !== undefined) Ammo.destroy(transformb);

          break;
        }
      case 'conetwist':
        {
          var _transforma = new Ammo.btTransform();
          _transforma.setIdentity();

          var _transformb = new Ammo.btTransform();
          _transformb.setIdentity();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          _vec3_2.setX(details.positionb.x);
          _vec3_2.setY(details.positionb.y);
          _vec3_2.setZ(details.positionb.z);

          _transforma.setOrigin(_vec3_1);
          _transformb.setOrigin(_vec3_2);

          var _rotation = _transforma.getRotation();
          _rotation.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
          _transforma.setRotation(_rotation);

          _rotation = _transformb.getRotation();
          _rotation.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
          _transformb.setRotation(_rotation);

          constraint = new Ammo.btConeTwistConstraint(_objects[details.objecta], _objects[details.objectb], _transforma, _transformb);

          constraint.setLimit(Math.PI, 0, Math.PI);

          constraint.ta = _transforma;
          constraint.tb = _transformb;

          Ammo.destroy(_transforma);
          Ammo.destroy(_transformb);

          break;
        }
      case 'dof':
        {
          var _transformb2 = void 0;

          var _transforma2 = new Ammo.btTransform();
          _transforma2.setIdentity();

          _vec3_1.setX(details.positiona.x);
          _vec3_1.setY(details.positiona.y);
          _vec3_1.setZ(details.positiona.z);

          _transforma2.setOrigin(_vec3_1);

          var _rotation2 = _transforma2.getRotation();
          _rotation2.setEulerZYX(-details.axisa.z, -details.axisa.y, -details.axisa.x);
          _transforma2.setRotation(_rotation2);

          if (details.objectb) {
            _transformb2 = new Ammo.btTransform();
            _transformb2.setIdentity();

            _vec3_2.setX(details.positionb.x);
            _vec3_2.setY(details.positionb.y);
            _vec3_2.setZ(details.positionb.z);

            _transformb2.setOrigin(_vec3_2);

            _rotation2 = _transformb2.getRotation();
            _rotation2.setEulerZYX(-details.axisb.z, -details.axisb.y, -details.axisb.x);
            _transformb2.setRotation(_rotation2);

            constraint = new Ammo.btGeneric6DofConstraint(_objects[details.objecta], _objects[details.objectb], _transforma2, _transformb2, true);
          } else {
            constraint = new Ammo.btGeneric6DofConstraint(_objects[details.objecta], _transforma2, true);
          }

          constraint.ta = _transforma2;
          constraint.tb = _transformb2;

          Ammo.destroy(_transforma2);
          if (_transformb2 !== undefined) Ammo.destroy(_transformb2);

          break;
        }
      default:
        return;
    }

    world.addConstraint(constraint);

    constraint.a = _objects[details.objecta];
    constraint.b = _objects[details.objectb];

    constraint.enableFeedback();
    _constraints[details.id] = constraint;
    _num_constraints++;

    if (SUPPORT_TRANSFERABLE) {
      constraintreport = new Float32Array(1 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE); // message id & ( # of objects to report * # of values per object )
      constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
    } else constraintreport = [MESSAGE_TYPES.CONSTRAINTREPORT];
  };

  public_functions.removeConstraint = function (details) {
    var constraint = _constraints[details.id];

    if (constraint !== undefined) {
      world.removeConstraint(constraint);
      _constraints[details.id] = null;
      _num_constraints--;
    }
  };

  public_functions.constraint_setBreakingImpulseThreshold = function (details) {
    var constraint = _constraints[details.id];
    if (constraint !== undefined) constraint.setBreakingImpulseThreshold(details.threshold);
  };

  public_functions.simulate = function () {
    var params = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    if (world) {
      if (params.timeStep && params.timeStep < fixedTimeStep) params.timeStep = fixedTimeStep;

      params.maxSubSteps = params.maxSubSteps || Math.ceil(params.timeStep / fixedTimeStep); // If maxSubSteps is not defined, keep the simulation fully up to date

      world.stepSimulation(params.timeStep, params.maxSubSteps, fixedTimeStep);

      if (_vehicles.length > 0) reportVehicles();
      reportCollisions();
      if (_constraints.length > 0) reportConstraints();
      reportWorld();
      if (_softbody_enabled) reportWorld_softbodies();
    }
  };

  // Constraint functions
  public_functions.hinge_setLimits = function (params) {
    _constraints[params.constraint].setLimit(params.low, params.high, 0, params.bias_factor, params.relaxation_factor);
  };

  public_functions.hinge_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableAngularMotor(true, params.velocity, params.acceleration);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.hinge_disableMotor = function (params) {
    _constraints[params.constraint].enableMotor(false);
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_setLimits = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setLowerLinLimit(params.lin_lower || 0);
    constraint.setUpperLinLimit(params.lin_upper || 0);

    constraint.setLowerAngLimit(params.ang_lower || 0);
    constraint.setUpperAngLimit(params.ang_upper || 0);
  };

  public_functions.slider_setRestitution = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setSoftnessLimLin(params.linear || 0);
    constraint.setSoftnessLimAng(params.angular || 0);
  };

  public_functions.slider_enableLinearMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setTargetLinMotorVelocity(params.velocity);
    constraint.setMaxLinMotorForce(params.acceleration);
    constraint.setPoweredLinMotor(true);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_disableLinearMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setPoweredLinMotor(false);
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setTargetAngMotorVelocity(params.velocity);
    constraint.setMaxAngMotorForce(params.acceleration);
    constraint.setPoweredAngMotor(true);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.slider_disableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setPoweredAngMotor(false);
    constraint.a.activate();
    if (constraint.b) constraint.b.activate();
  };

  public_functions.conetwist_setLimit = function (params) {
    _constraints[params.constraint].setLimit(params.z, params.y, params.x); // ZYX order
  };

  public_functions.conetwist_enableMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableMotor(true);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_setMaxMotorImpulse = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.setMaxMotorImpulse(params.max_impulse);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_setMotorTarget = function (params) {
    var constraint = _constraints[params.constraint];

    _quat.setX(params.x);
    _quat.setY(params.y);
    _quat.setZ(params.z);
    _quat.setW(params.w);

    constraint.setMotorTarget(_quat);

    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.conetwist_disableMotor = function (params) {
    var constraint = _constraints[params.constraint];
    constraint.enableMotor(false);
    constraint.a.activate();
    constraint.b.activate();
  };

  public_functions.dof_setLinearLowerLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setLinearLowerLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setLinearUpperLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setLinearUpperLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setAngularLowerLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setAngularLowerLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_setAngularUpperLimit = function (params) {
    var constraint = _constraints[params.constraint];

    _vec3_1.setX(params.x);
    _vec3_1.setY(params.y);
    _vec3_1.setZ(params.z);

    constraint.setAngularUpperLimit(_vec3_1);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_enableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint];

    var motor = constraint.getRotationalLimitMotor(params.which);
    motor.set_m_enableMotor(true);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_configureAngularMotor = function (params) {
    var constraint = _constraints[params.constraint],
        motor = constraint.getRotationalLimitMotor(params.which);

    motor.set_m_loLimit(params.low_angle);
    motor.set_m_hiLimit(params.high_angle);
    motor.set_m_targetVelocity(params.velocity);
    motor.set_m_maxMotorForce(params.max_force);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  public_functions.dof_disableAngularMotor = function (params) {
    var constraint = _constraints[params.constraint],
        motor = constraint.getRotationalLimitMotor(params.which);

    motor.set_m_enableMotor(false);
    constraint.a.activate();

    if (constraint.b) constraint.b.activate();
  };

  var reportWorld = function reportWorld() {
    if (SUPPORT_TRANSFERABLE && worldreport.length < 2 + _num_rigidbody_objects * WORLDREPORT_ITEMSIZE) {
      worldreport = new Float32Array(2 // message id & # objects in report
      + Math.ceil(_num_rigidbody_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * WORLDREPORT_ITEMSIZE // # of values needed * item size
      );

      worldreport[0] = MESSAGE_TYPES.WORLDREPORT;
    }

    worldreport[1] = _num_rigidbody_objects; // record how many objects we're reporting on

    {
      var i = 0,
          index = _objects.length;

      while (index--) {
        var object = _objects[index];

        if (object && object.type === 1) {
          // RigidBodies.
          // #TODO: we can't use center of mass transform when center of mass can change,
          //        but getMotionState().getWorldTransform() screws up on objects that have been moved
          // object.getMotionState().getWorldTransform( transform );
          // object.getMotionState().getWorldTransform(_transform);

          var transform = object.getCenterOfMassTransform();
          var origin = transform.getOrigin();
          var rotation = transform.getRotation();

          // add values to report
          var offset = 2 + i++ * WORLDREPORT_ITEMSIZE;

          worldreport[offset] = object.id;

          worldreport[offset + 1] = origin.x();
          worldreport[offset + 2] = origin.y();
          worldreport[offset + 3] = origin.z();

          worldreport[offset + 4] = rotation.x();
          worldreport[offset + 5] = rotation.y();
          worldreport[offset + 6] = rotation.z();
          worldreport[offset + 7] = rotation.w();

          _vector = object.getLinearVelocity();
          worldreport[offset + 8] = _vector.x();
          worldreport[offset + 9] = _vector.y();
          worldreport[offset + 10] = _vector.z();

          _vector = object.getAngularVelocity();
          worldreport[offset + 11] = _vector.x();
          worldreport[offset + 12] = _vector.y();
          worldreport[offset + 13] = _vector.z();
        }
      }
    }

    if (SUPPORT_TRANSFERABLE) send(worldreport.buffer, [worldreport.buffer]);else send(worldreport);
  };

  var reportWorld_softbodies = function reportWorld_softbodies() {
    // TODO: Add SUPPORTTRANSFERABLE.

    softreport = new Float32Array(2 // message id & # objects in report
    + _num_softbody_objects * 2 + _softbody_report_size * 6);

    softreport[0] = MESSAGE_TYPES.SOFTREPORT;
    softreport[1] = _num_softbody_objects; // record how many objects we're reporting on

    {
      var offset = 2,
          index = _objects.length;

      while (index--) {
        var object = _objects[index];

        if (object && object.type === 0) {
          // SoftBodies.

          softreport[offset] = object.id;

          var offsetVert = offset + 2;

          if (object.rope === true) {
            var nodes = object.get_m_nodes();
            var size = nodes.size();
            softreport[offset + 1] = size;

            for (var i = 0; i < size; i++) {
              var node = nodes.at(i);
              var vert = node.get_m_x();
              var off = offsetVert + i * 3;

              softreport[off] = vert.x();
              softreport[off + 1] = vert.y();
              softreport[off + 2] = vert.z();
            }

            offset += size * 3 + 2;
          } else if (object.cloth) {
            var _nodes = object.get_m_nodes();
            var _size = _nodes.size();
            softreport[offset + 1] = _size;

            for (var _i3 = 0; _i3 < _size; _i3++) {
              var _node = _nodes.at(_i3);
              var _vert = _node.get_m_x();
              var normal = _node.get_m_n();
              var _off = offsetVert + _i3 * 6;

              softreport[_off] = _vert.x();
              softreport[_off + 1] = _vert.y();
              softreport[_off + 2] = _vert.z();

              softreport[_off + 3] = -normal.x();
              softreport[_off + 4] = -normal.y();
              softreport[_off + 5] = -normal.z();
            }

            offset += _size * 6 + 2;
          } else {
            var faces = object.get_m_faces();
            var _size2 = faces.size();
            softreport[offset + 1] = _size2;

            for (var _i4 = 0; _i4 < _size2; _i4++) {
              var face = faces.at(_i4);

              var node1 = face.get_m_n(0);
              var node2 = face.get_m_n(1);
              var node3 = face.get_m_n(2);

              var vert1 = node1.get_m_x();
              var vert2 = node2.get_m_x();
              var vert3 = node3.get_m_x();

              var normal1 = node1.get_m_n();
              var normal2 = node2.get_m_n();
              var normal3 = node3.get_m_n();

              var _off2 = offsetVert + _i4 * 18;

              softreport[_off2] = vert1.x();
              softreport[_off2 + 1] = vert1.y();
              softreport[_off2 + 2] = vert1.z();

              softreport[_off2 + 3] = normal1.x();
              softreport[_off2 + 4] = normal1.y();
              softreport[_off2 + 5] = normal1.z();

              softreport[_off2 + 6] = vert2.x();
              softreport[_off2 + 7] = vert2.y();
              softreport[_off2 + 8] = vert2.z();

              softreport[_off2 + 9] = normal2.x();
              softreport[_off2 + 10] = normal2.y();
              softreport[_off2 + 11] = normal2.z();

              softreport[_off2 + 12] = vert3.x();
              softreport[_off2 + 13] = vert3.y();
              softreport[_off2 + 14] = vert3.z();

              softreport[_off2 + 15] = normal3.x();
              softreport[_off2 + 16] = normal3.y();
              softreport[_off2 + 17] = normal3.z();
            }

            offset += _size2 * 18 + 2;
          }
        }
      }
    }

    // if (SUPPORT_TRANSFERABLE) send(softreport.buffer, [softreport.buffer]);
    // else send(softreport);
    send(softreport);
  };

  var reportCollisions = function reportCollisions() {
    var dp = world.getDispatcher(),
        num = dp.getNumManifolds();
    // _collided = false;

    if (SUPPORT_TRANSFERABLE) {
      if (collisionreport.length < 2 + num * COLLISIONREPORT_ITEMSIZE) {
        collisionreport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_objects / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * COLLISIONREPORT_ITEMSIZE // # of values needed * item size
        );
        collisionreport[0] = MESSAGE_TYPES.COLLISIONREPORT;
      }
    }

    collisionreport[1] = 0; // how many collisions we're reporting on

    for (var i = 0; i < num; i++) {
      var manifold = dp.getManifoldByIndexInternal(i),
          num_contacts = manifold.getNumContacts();

      if (num_contacts === 0) continue;

      for (var j = 0; j < num_contacts; j++) {
        var pt = manifold.getContactPoint(j);

        // if ( pt.getDistance() < 0 ) {
        var offset = 2 + collisionreport[1]++ * COLLISIONREPORT_ITEMSIZE;
        collisionreport[offset] = _objects_ammo[manifold.getBody0().ptr];
        collisionreport[offset + 1] = _objects_ammo[manifold.getBody1().ptr];

        _vector = pt.get_m_normalWorldOnB();
        collisionreport[offset + 2] = _vector.x();
        collisionreport[offset + 3] = _vector.y();
        collisionreport[offset + 4] = _vector.z();
        break;
        // }
        // send(_objects_ammo);
      }
    }

    if (SUPPORT_TRANSFERABLE) send(collisionreport.buffer, [collisionreport.buffer]);else send(collisionreport);
  };

  var reportVehicles = function reportVehicles() {
    if (SUPPORT_TRANSFERABLE) {
      if (vehiclereport.length < 2 + _num_wheels * VEHICLEREPORT_ITEMSIZE) {
        vehiclereport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_wheels / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * VEHICLEREPORT_ITEMSIZE // # of values needed * item size
        );
        vehiclereport[0] = MESSAGE_TYPES.VEHICLEREPORT;
      }
    }

    {
      var i = 0,
          j = 0,
          index = _vehicles.length;

      while (index--) {
        if (_vehicles[index]) {
          var vehicle = _vehicles[index];

          for (j = 0; j < vehicle.getNumWheels(); j++) {
            // vehicle.updateWheelTransform( j, true );
            // transform = vehicle.getWheelTransformWS( j );
            var transform = vehicle.getWheelInfo(j).get_m_worldTransform();

            var origin = transform.getOrigin();
            var rotation = transform.getRotation();

            // add values to report
            var offset = 1 + i++ * VEHICLEREPORT_ITEMSIZE;

            vehiclereport[offset] = index;
            vehiclereport[offset + 1] = j;

            vehiclereport[offset + 2] = origin.x();
            vehiclereport[offset + 3] = origin.y();
            vehiclereport[offset + 4] = origin.z();

            vehiclereport[offset + 5] = rotation.x();
            vehiclereport[offset + 6] = rotation.y();
            vehiclereport[offset + 7] = rotation.z();
            vehiclereport[offset + 8] = rotation.w();
          }
        }
      }

      if (SUPPORT_TRANSFERABLE && j !== 0) send(vehiclereport.buffer, [vehiclereport.buffer]);else if (j !== 0) send(vehiclereport);
    }
  };

  var reportConstraints = function reportConstraints() {
    if (SUPPORT_TRANSFERABLE) {
      if (constraintreport.length < 2 + _num_constraints * CONSTRAINTREPORT_ITEMSIZE) {
        constraintreport = new Float32Array(2 // message id & # objects in report
        + Math.ceil(_num_constraints / REPORT_CHUNKSIZE) * REPORT_CHUNKSIZE * CONSTRAINTREPORT_ITEMSIZE // # of values needed * item size
        );
        constraintreport[0] = MESSAGE_TYPES.CONSTRAINTREPORT;
      }
    }

    {
      var offset = 0,
          i = 0,
          index = _constraints.lenght;

      while (index--) {
        if (_constraints[index]) {
          var _constraint = _constraints[index];
          var offset_body = _constraint.a;
          var transform = _constraint.ta;
          var origin = transform.getOrigin();

          // add values to report
          offset = 1 + i++ * CONSTRAINTREPORT_ITEMSIZE;

          constraintreport[offset] = index;
          constraintreport[offset + 1] = offset_body.id;
          constraintreport[offset + 2] = origin.x;
          constraintreport[offset + 3] = origin.y;
          constraintreport[offset + 4] = origin.z;
          constraintreport[offset + 5] = _constraint.getBreakingImpulseThreshold();
        }
      }

      if (SUPPORT_TRANSFERABLE && i !== 0) send(constraintreport.buffer, [constraintreport.buffer]);else if (i !== 0) send(constraintreport);
    }
  };

  self.onmessage = function (event) {
    if (event.data instanceof Float32Array) {
      // transferable object
      switch (event.data[0]) {
        case MESSAGE_TYPES.WORLDREPORT:
          {
            worldreport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.COLLISIONREPORT:
          {
            collisionreport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.VEHICLEREPORT:
          {
            vehiclereport = new Float32Array(event.data);
            break;
          }
        case MESSAGE_TYPES.CONSTRAINTREPORT:
          {
            constraintreport = new Float32Array(event.data);
            break;
          }
        default:
      }

      return;
    } else if (event.data.cmd && public_functions[event.data.cmd]) public_functions[event.data.cmd](event.data.params);
  };

  self.receive = self.onmessage;
});

var WorldModule = function (_WorldModuleBase) {
  inherits(WorldModule, _WorldModuleBase);

  function WorldModule() {
    var _ref;

    classCallCheck(this, WorldModule);

    for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }

    var _this = possibleConstructorReturn(this, (_ref = WorldModule.__proto__ || Object.getPrototypeOf(WorldModule)).call.apply(_ref, [this].concat(args)));

    _this.worker = new PhysicsWorker();
    _this.worker.transferableMessage = _this.worker.webkitPostMessage || _this.worker.postMessage;

    _this.isLoaded = false;

    var options = _this.options;

    _this.loader = new Promise(function (resolve, reject) {
      // if (options.wasm) {
      //   fetch(options.wasm)
      //     .then(response => response.arrayBuffer())
      //     .then(buffer => {
      //       options.wasmBuffer = buffer;
      //
      //       this.execute('init', options);
      //       resolve();
      //     });
      // } else {
      _this.execute('init', options);
      resolve();
      // }
    });

    _this.loader.then(function () {
      _this.isLoaded = true;
    });

    // Test SUPPORT_TRANSFERABLE

    var ab = new ArrayBuffer(1);
    _this.worker.transferableMessage(ab, [ab]);
    _this.SUPPORT_TRANSFERABLE = ab.byteLength === 0;

    _this.setup();
    return _this;
  }

  createClass(WorldModule, [{
    key: 'send',
    value: function send() {
      var _worker;

      (_worker = this.worker).transferableMessage.apply(_worker, arguments);
    }
  }, {
    key: 'receive',
    value: function receive(callback) {
      this.worker.addEventListener('message', callback);
    }
  }]);
  return WorldModule;
}(WorldModuleBase);

var _class$1, _temp;

var properties = {
  position: {
    get: function get$$1() {
      return this._native.position;
    },
    set: function set$$1(vector3) {
      var pos = this._native.position;
      var scope = this;

      Object.defineProperties(pos, {
        x: {
          get: function get$$1() {
            return this._x;
          },
          set: function set$$1(x) {
            scope.__dirtyPosition = true;
            this._x = x;
          }
        },
        y: {
          get: function get$$1() {
            return this._y;
          },
          set: function set$$1(y) {
            scope.__dirtyPosition = true;
            this._y = y;
          }
        },
        z: {
          get: function get$$1() {
            return this._z;
          },
          set: function set$$1(z) {
            scope.__dirtyPosition = true;
            this._z = z;
          }
        }
      });

      scope.__dirtyPosition = true;

      pos.copy(vector3);
    }
  },

  quaternion: {
    get: function get$$1() {
      this.__c_rot = true;
      return this.native.quaternion;
    },
    set: function set$$1(quaternion) {
      var _this = this;

      var quat = this._native.quaternion,
          native = this._native;

      quat.copy(quaternion);

      quat.onChange(function () {
        if (_this.__c_rot) {
          if (native.__dirtyRotation === true) {
            _this.__c_rot = false;
            native.__dirtyRotation = false;
          }
          native.__dirtyRotation = true;
        }
      });
    }
  },

  rotation: {
    get: function get$$1() {
      this.__c_rot = true;
      return this._native.rotation;
    },
    set: function set$$1(euler) {
      var _this2 = this;

      var rot = this._native.rotation,
          native = this._native;

      this.quaternion.copy(new Quaternion().setFromEuler(euler));

      rot.onChange(function () {
        if (_this2.__c_rot) {
          _this2.quaternion.copy(new Quaternion().setFromEuler(rot));
          native.__dirtyRotation = true;
        }
      });
    }
  }
};

function wrapPhysicsPrototype(scope) {
  for (var key in properties) {
    Object.defineProperty(scope, key, {
      get: properties[key].get.bind(scope),
      set: properties[key].set.bind(scope),
      configurable: true,
      enumerable: true
    });
  }
}

function onCopy(source) {
  wrapPhysicsPrototype(this);

  var physics = this.use('physics');
  var sourcePhysics = source.use('physics');

  this.manager.modules.physics = physics.clone(this.manager);

  physics.data = _extends({}, sourcePhysics.data);
  physics.data.isSoftBodyReset = false;
  if (physics.data.isSoftbody) physics.data.isSoftBodyReset = false;

  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();

  return source;
}

function onWrap() {
  this.position = this.position.clone();
  this.rotation = this.rotation.clone();
  this.quaternion = this.quaternion.clone();
}

var API = function () {
  function API() {
    classCallCheck(this, API);
  }

  createClass(API, [{
    key: 'applyCentralImpulse',
    value: function applyCentralImpulse(force) {
      this.execute('applyCentralImpulse', { id: this.data.id, x: force.x, y: force.y, z: force.z });
    }
  }, {
    key: 'applyImpulse',
    value: function applyImpulse(force, offset) {
      this.execute('applyImpulse', {
        id: this.data.id,
        impulse_x: force.x,
        impulse_y: force.y,
        impulse_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  }, {
    key: 'applyTorque',
    value: function applyTorque(force) {
      this.execute('applyTorque', {
        id: this.data.id,
        torque_x: force.x,
        torque_y: force.y,
        torque_z: force.z
      });
    }
  }, {
    key: 'applyCentralForce',
    value: function applyCentralForce(force) {
      this.execute('applyCentralForce', {
        id: this.data.id,
        x: force.x,
        y: force.y,
        z: force.z
      });
    }
  }, {
    key: 'applyForce',
    value: function applyForce(force, offset) {
      this.execute('applyForce', {
        id: this.data.id,
        force_x: force.x,
        force_y: force.y,
        force_z: force.z,
        x: offset.x,
        y: offset.y,
        z: offset.z
      });
    }
  }, {
    key: 'getAngularVelocity',
    value: function getAngularVelocity() {
      return this.data.angularVelocity;
    }
  }, {
    key: 'setAngularVelocity',
    value: function setAngularVelocity(velocity) {
      this.execute('setAngularVelocity', { id: this.data.id, x: velocity.x, y: velocity.y, z: velocity.z });
    }
  }, {
    key: 'getLinearVelocity',
    value: function getLinearVelocity() {
      return this.data.linearVelocity;
    }
  }, {
    key: 'setLinearVelocity',
    value: function setLinearVelocity(velocity) {
      this.execute('setLinearVelocity', { id: this.data.id, x: velocity.x, y: velocity.y, z: velocity.z });
    }
  }, {
    key: 'setAngularFactor',
    value: function setAngularFactor(factor) {
      this.execute('setAngularFactor', { id: this.data.id, x: factor.x, y: factor.y, z: factor.z });
    }
  }, {
    key: 'setLinearFactor',
    value: function setLinearFactor(factor) {
      this.execute('setLinearFactor', { id: this.data.id, x: factor.x, y: factor.y, z: factor.z });
    }
  }, {
    key: 'setDamping',
    value: function setDamping(linear, angular) {
      this.execute('setDamping', { id: this.data.id, linear: linear, angular: angular });
    }
  }, {
    key: 'setCcdMotionThreshold',
    value: function setCcdMotionThreshold(threshold) {
      this.execute('setCcdMotionThreshold', { id: this.data.id, threshold: threshold });
    }
  }, {
    key: 'setCcdSweptSphereRadius',
    value: function setCcdSweptSphereRadius(radius) {
      this.execute('setCcdSweptSphereRadius', { id: this.data.id, radius: radius });
    }
  }]);
  return API;
}();

var _default = (_temp = _class$1 = function (_API) {
  inherits(_default, _API);

  function _default(defaults$$1, data) {
    classCallCheck(this, _default);

    var _this3 = possibleConstructorReturn(this, (_default.__proto__ || Object.getPrototypeOf(_default)).call(this));

    _this3.bridge = {
      onCopy: onCopy,
      onWrap: onWrap
    };

    _this3.data = Object.assign(defaults$$1, data);
    return _this3;
  }

  createClass(_default, [{
    key: 'integrate',
    value: function integrate(self) {
      wrapPhysicsPrototype(this);
    }
  }, {
    key: 'manager',
    value: function manager(_manager) {
      _manager.define('physics');

      this.execute = function () {
        var _manager$get;

        return _manager.has('module:world') ? (_manager$get = _manager.get('module:world')).execute.apply(_manager$get, arguments) : function () {};
      };
    }
  }, {
    key: 'updateData',
    value: function updateData(callback) {
      this.bridge.geometry = function (geometry, module) {
        if (!callback) return geometry;

        var result = callback(geometry, module);
        return result ? result : geometry;
      };
    }
  }, {
    key: 'clone',
    value: function clone(manager) {
      var clone = new this.constructor();
      clone.data = _extends({}, this.data);
      clone.bridge.geometry = this.bridge.geometry;
      this.manager.apply(clone, [manager]);

      return clone;
    }
  }]);
  return _default;
}(API), _class$1.rigidbody = function () {
  return {
    touches: [],
    linearVelocity: new Vector3$1(),
    angularVelocity: new Vector3$1(),
    mass: 10,
    scale: new Vector3$1(1, 1, 1),
    restitution: 0.3,
    friction: 0.8,
    damping: 0,
    margin: 0
  };
}, _class$1.softbody = function () {
  return {
    touches: [],
    restitution: 0.3,
    friction: 0.8,
    damping: 0,
    scale: new Vector3$1(1, 1, 1),
    pressure: 100,
    margin: 0,
    klst: 0.9,
    kvst: 0.9,
    kast: 0.9,
    piterations: 1,
    viterations: 0,
    diterations: 0,
    citerations: 4,
    anchorHardness: 0.7,
    rigidHardness: 1,
    isSoftbody: true,
    isSoftBodyReset: false
  };
}, _class$1.rope = function () {
  return {
    touches: [],
    friction: 0.8,
    scale: new Vector3$1(1, 1, 1),
    damping: 0,
    margin: 0,
    klst: 0.9,
    kvst: 0.9,
    kast: 0.9,
    piterations: 1,
    viterations: 0,
    diterations: 0,
    citerations: 4,
    anchorHardness: 0.7,
    rigidHardness: 1,
    isSoftbody: true
  };
}, _class$1.cloth = function () {
  return {
    touches: [],
    friction: 0.8,
    damping: 0,
    margin: 0,
    scale: new Vector3$1(1, 1, 1),
    klst: 0.9,
    kvst: 0.9,
    kast: 0.9,
    piterations: 1,
    viterations: 0,
    diterations: 0,
    citerations: 4,
    anchorHardness: 0.7,
    rigidHardness: 1
  };
}, _temp);

var BoxModule = function (_PhysicsModule) {
  inherits(BoxModule, _PhysicsModule);

  function BoxModule(params) {
    classCallCheck(this, BoxModule);

    var _this = possibleConstructorReturn(this, (BoxModule.__proto__ || Object.getPrototypeOf(BoxModule)).call(this, _extends({
      type: 'box'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return BoxModule;
}(_default);

var CompoundModule = function (_PhysicsModule) {
  inherits(CompoundModule, _PhysicsModule);

  function CompoundModule(params) {
    classCallCheck(this, CompoundModule);
    return possibleConstructorReturn(this, (CompoundModule.__proto__ || Object.getPrototypeOf(CompoundModule)).call(this, _extends({
      type: 'compound'
    }, _default.rigidbody()), params));
  }

  return CompoundModule;
}(_default);

// TODO: Test CapsuleModule in action.
var CapsuleModule = function (_PhysicsModule) {
  inherits(CapsuleModule, _PhysicsModule);

  function CapsuleModule(params) {
    classCallCheck(this, CapsuleModule);

    var _this = possibleConstructorReturn(this, (CapsuleModule.__proto__ || Object.getPrototypeOf(CapsuleModule)).call(this, _extends({
      type: 'capsule'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return CapsuleModule;
}(_default);

var ConcaveModule = function (_PhysicsModule) {
  inherits(ConcaveModule, _PhysicsModule);

  function ConcaveModule(params) {
    classCallCheck(this, ConcaveModule);

    var _this = possibleConstructorReturn(this, (ConcaveModule.__proto__ || Object.getPrototypeOf(ConcaveModule)).call(this, _extends({
      type: 'concave'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      data.data = _this.geometryProcessor(geometry);
    });
    return _this;
  }

  createClass(ConcaveModule, [{
    key: 'geometryProcessor',
    value: function geometryProcessor(geometry) {
      if (!geometry.boundingBox) geometry.computeBoundingBox();

      var data = geometry.isBufferGeometry ? geometry.attributes.position.array : new Float32Array(geometry.faces.length * 9);

      if (!geometry.isBufferGeometry) {
        var vertices = geometry.vertices;

        for (var i = 0; i < geometry.faces.length; i++) {
          var face = geometry.faces[i];

          var vA = vertices[face.a];
          var vB = vertices[face.b];
          var vC = vertices[face.c];

          var i9 = i * 9;

          data[i9] = vA.x;
          data[i9 + 1] = vA.y;
          data[i9 + 2] = vA.z;

          data[i9 + 3] = vB.x;
          data[i9 + 4] = vB.y;
          data[i9 + 5] = vB.z;

          data[i9 + 6] = vC.x;
          data[i9 + 7] = vC.y;
          data[i9 + 8] = vC.z;
        }
      }

      return data;
    }
  }]);
  return ConcaveModule;
}(_default);

var ConeModule = function (_PhysicsModule) {
  inherits(ConeModule, _PhysicsModule);

  function ConeModule(params) {
    classCallCheck(this, ConeModule);

    var _this = possibleConstructorReturn(this, (ConeModule.__proto__ || Object.getPrototypeOf(ConeModule)).call(this, _extends({
      type: 'cone'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.radius = data.radius || (geometry.boundingBox.max.x - geometry.boundingBox.min.x) / 2;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    });
    return _this;
  }

  return ConeModule;
}(_default);

var ConvexModule = function (_PhysicsModule) {
  inherits(ConvexModule, _PhysicsModule);

  function ConvexModule(params) {
    classCallCheck(this, ConvexModule);

    var _this = possibleConstructorReturn(this, (ConvexModule.__proto__ || Object.getPrototypeOf(ConvexModule)).call(this, _extends({
      type: 'convex'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();
      if (!geometry.isBufferGeometry) geometry._bufferGeometry = new BufferGeometry().fromGeometry(geometry);

      data.data = geometry.isBufferGeometry ? geometry.attributes.position.array : geometry._bufferGeometry.attributes.position.array;
    });
    return _this;
  }

  return ConvexModule;
}(_default);

var CylinderModule = function (_PhysicsModule) {
  inherits(CylinderModule, _PhysicsModule);

  function CylinderModule(params) {
    classCallCheck(this, CylinderModule);

    var _this = possibleConstructorReturn(this, (CylinderModule.__proto__ || Object.getPrototypeOf(CylinderModule)).call(this, _extends({
      type: 'cylinder'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.depth = data.depth || geometry.boundingBox.max.z - geometry.boundingBox.min.z;
    });
    return _this;
  }

  return CylinderModule;
}(_default);

var HeightfieldModule = function (_PhysicsModule) {
  inherits(HeightfieldModule, _PhysicsModule);

  function HeightfieldModule(params) {
    classCallCheck(this, HeightfieldModule);

    var _this = possibleConstructorReturn(this, (HeightfieldModule.__proto__ || Object.getPrototypeOf(HeightfieldModule)).call(this, _extends({
      type: 'heightfield',
      size: new Vector2(1, 1),
      autoAlign: false
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;
      var _data$size = data.size,
          xdiv = _data$size.x,
          ydiv = _data$size.y;

      var verts = geometry.isBufferGeometry ? geometry.attributes.position.array : geometry.vertices;
      var size = geometry.isBufferGeometry ? verts.length / 3 : verts.length;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      var xsize = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      var ysize = geometry.boundingBox.max.z - geometry.boundingBox.min.z;

      data.xpts = typeof xdiv === 'undefined' ? Math.sqrt(size) : xdiv + 1;
      data.ypts = typeof ydiv === 'undefined' ? Math.sqrt(size) : ydiv + 1;

      // note - this assumes our plane geometry is square, unless we pass in specific xdiv and ydiv
      data.absMaxHeight = Math.max(geometry.boundingBox.max.y, Math.abs(geometry.boundingBox.min.y));

      var points = new Float32Array(size),
          xpts = data.xpts,
          ypts = data.ypts;

      while (size--) {
        var vNum = size % xpts + (ypts - Math.round(size / xpts - size % xpts / xpts) - 1) * ypts;

        if (geometry.isBufferGeometry) points[size] = verts[vNum * 3 + 1];else points[size] = verts[vNum].y;
      }

      data.points = points;

      data.scale.multiply(new Vector3$1(xsize / (xpts - 1), 1, ysize / (ypts - 1)));

      if (data.autoAlign) geometry.translate(xsize / -2, 0, ysize / -2);
    });
    return _this;
  }

  return HeightfieldModule;
}(_default);

var PlaneModule = function (_PhysicsModule) {
  inherits(PlaneModule, _PhysicsModule);

  function PlaneModule(params) {
    classCallCheck(this, PlaneModule);

    var _this = possibleConstructorReturn(this, (PlaneModule.__proto__ || Object.getPrototypeOf(PlaneModule)).call(this, _extends({
      type: 'plane'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingBox) geometry.computeBoundingBox();

      data.width = data.width || geometry.boundingBox.max.x - geometry.boundingBox.min.x;
      data.height = data.height || geometry.boundingBox.max.y - geometry.boundingBox.min.y;
      data.normal = data.normal || geometry.faces[0].normal.clone();
    });
    return _this;
  }

  return PlaneModule;
}(_default);

var SphereModule = function (_PhysicsModule) {
  inherits(SphereModule, _PhysicsModule);

  function SphereModule(params) {
    classCallCheck(this, SphereModule);

    var _this = possibleConstructorReturn(this, (SphereModule.__proto__ || Object.getPrototypeOf(SphereModule)).call(this, _extends({
      type: 'sphere'
    }, _default.rigidbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.boundingSphere) geometry.computeBoundingSphere();
      data.radius = data.radius || geometry.boundingSphere.radius;
    });
    return _this;
  }

  return SphereModule;
}(_default);

var SoftbodyModule = function (_PhysicsModule) {
  inherits(SoftbodyModule, _PhysicsModule);

  function SoftbodyModule(params) {
    classCallCheck(this, SoftbodyModule);

    var _this = possibleConstructorReturn(this, (SoftbodyModule.__proto__ || Object.getPrototypeOf(SoftbodyModule)).call(this, _extends({
      type: 'softTrimesh'
    }, _default.softbody()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      var idxGeometry = geometry.isBufferGeometry ? geometry : function () {
        geometry.mergeVertices();

        var bufferGeometry = new BufferGeometry();

        bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        bufferGeometry.setIndex(new BufferAttribute(new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3), 1).copyIndicesArray(geometry.faces));

        return bufferGeometry;
      }();

      data.aVertices = idxGeometry.attributes.position.array;
      data.aIndices = idxGeometry.index.array;

      return new BufferGeometry().fromGeometry(geometry);
    });
    return _this;
  }

  createClass(SoftbodyModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node) {
      var influence = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 1;
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }]);
  return SoftbodyModule;
}(_default);

function arrayMax(array) {
  if (array.length === 0) return -Infinity;

  var max = array[0];

  for (var i = 1, l = array.length; i < l; ++i) {
    if (array[i] > max) max = array[i];
  }

  return max;
}

var ClothModule = function (_PhysicsModule) {
  inherits(ClothModule, _PhysicsModule);

  function ClothModule(params) {
    classCallCheck(this, ClothModule);

    var _this = possibleConstructorReturn(this, (ClothModule.__proto__ || Object.getPrototypeOf(ClothModule)).call(this, _extends({
      type: 'softClothMesh'
    }, _default.cloth()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      var geomParams = geometry.parameters;

      var geom = geometry.isBufferGeometry ? geometry : function () {
        geometry.mergeVertices();

        var bufferGeometry = new BufferGeometry();

        bufferGeometry.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

        var faces = geometry.faces,
            facesLength = faces.length,
            uvs = geometry.faceVertexUvs[0];

        var normalsArray = new Float32Array(facesLength * 3);
        // const uvsArray = new Array(geometry.vertices.length * 2);
        var uvsArray = new Float32Array(facesLength * 2);
        var faceArray = new Uint32Array(facesLength * 3);

        for (var i = 0; i < facesLength; i++) {
          var i3 = i * 3;
          var normal = faces[i].normal || new Vector3();

          faceArray[i3] = faces[i].a;
          faceArray[i3 + 1] = faces[i].b;
          faceArray[i3 + 2] = faces[i].c;

          normalsArray[i3] = normal.x;
          normalsArray[i3 + 1] = normal.y;
          normalsArray[i3 + 2] = normal.z;

          uvsArray[faces[i].a * 2 + 0] = uvs[i][0].x; // a
          uvsArray[faces[i].a * 2 + 1] = uvs[i][0].y;

          uvsArray[faces[i].b * 2 + 0] = uvs[i][1].x; // b
          uvsArray[faces[i].b * 2 + 1] = uvs[i][1].y;

          uvsArray[faces[i].c * 2 + 0] = uvs[i][2].x; // c
          uvsArray[faces[i].c * 2 + 1] = uvs[i][2].y;
        }

        bufferGeometry.addAttribute('normal', new BufferAttribute(normalsArray, 3));

        bufferGeometry.addAttribute('uv', new BufferAttribute(uvsArray, 2));

        bufferGeometry.setIndex(new BufferAttribute(new (arrayMax(faces) * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

        return bufferGeometry;
      }();

      var verts = geom.attributes.position.array;

      if (!geomParams.widthSegments) geomParams.widthSegments = 1;
      if (!geomParams.heightSegments) geomParams.heightSegments = 1;

      var idx00 = 0;
      var idx01 = geomParams.widthSegments;
      var idx10 = (geomParams.heightSegments + 1) * (geomParams.widthSegments + 1) - (geomParams.widthSegments + 1);
      var idx11 = verts.length / 3 - 1;

      data.corners = [verts[idx01 * 3], verts[idx01 * 3 + 1], verts[idx01 * 3 + 2], //   ╗
      verts[idx00 * 3], verts[idx00 * 3 + 1], verts[idx00 * 3 + 2], // ╔
      verts[idx11 * 3], verts[idx11 * 3 + 1], verts[idx11 * 3 + 2], //       ╝
      verts[idx10 * 3], verts[idx10 * 3 + 1], verts[idx10 * 3 + 2]];

      data.segments = [geomParams.widthSegments + 1, geomParams.heightSegments + 1];

      return geom;
    });
    return _this;
  }

  createClass(ClothModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }, {
    key: 'linkNodes',
    value: function linkNodes(object, n1, n2, modifier) {
      var self = this.data.id;
      var body = object.use('physics').data.id;

      this.execute('linkNodes', {
        self: self,
        body: body,
        n1: n1, // self node
        n2: n2, // body node
        modifier: modifier
      });
    }
  }, {
    key: 'appendLinearJoint',
    value: function appendLinearJoint(object, specs) {
      var self = this.data.id;
      var body = object.use('physics').data.id;

      this.execute('appendLinearJoint', {
        self: self,
        body: body,
        specs: specs
      });
    }
  }]);
  return ClothModule;
}(_default);

var RopeModule = function (_PhysicsModule) {
  inherits(RopeModule, _PhysicsModule);

  function RopeModule(params) {
    classCallCheck(this, RopeModule);

    var _this = possibleConstructorReturn(this, (RopeModule.__proto__ || Object.getPrototypeOf(RopeModule)).call(this, _extends({
      type: 'softRopeMesh'
    }, _default.rope()), params));

    _this.updateData(function (geometry, _ref) {
      var data = _ref.data;

      if (!geometry.isBufferGeometry) {
        geometry = function () {
          var buff = new BufferGeometry();

          buff.addAttribute('position', new BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

          return buff;
        }();
      }

      var length = geometry.attributes.position.array.length / 3;
      var vert = function vert(n) {
        return new Vector3$1().fromArray(geometry.attributes.position.array, n * 3);
      };

      var v1 = vert(0);
      var v2 = vert(length - 1);

      data.data = [v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, length];

      return geometry;
    });
    return _this;
  }

  createClass(RopeModule, [{
    key: 'appendAnchor',
    value: function appendAnchor(object, node, influence) {
      var collisionBetweenLinkedBodies = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

      var o1 = this.data.id;
      var o2 = object.use('physics').data.id;

      this.execute('appendAnchor', {
        obj: o1,
        obj2: o2,
        node: node,
        influence: influence,
        collisionBetweenLinkedBodies: collisionBetweenLinkedBodies
      });
    }
  }]);
  return RopeModule;
}(_default);

var _class$2, _temp$1;

var PI_2 = Math.PI / 2;

// TODO: Fix DOM
function FirstPersonControlsSolver(camera, mesh, params) {
  var _this = this;

  var velocityFactor = 1;
  var runVelocity = 0.25;

  mesh.use('physics').setAngularFactor({ x: 0, y: 0, z: 0 });
  camera.position.set(0, 0, 0);

  /* Init */
  var player = mesh,
      pitchObject = new Object3D();

  pitchObject.add(camera.native);

  var yawObject = new Object3D();

  yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
  yawObject.add(pitchObject);

  var quat = new Quaternion();

  var canJump = false,

  // Moves.
  moveForward = false,
      moveBackward = false,
      moveLeft = false,
      moveRight = false;

  player.on('collision', function (otherObject, v, r, contactNormal) {
    console.log(contactNormal.y);
    if (contactNormal.y < 0.5) // Use a "good" threshold value between 0 and 1 here!
      canJump = true;
  });

  var onMouseMove = function onMouseMove(event) {
    if (_this.enabled === false) return;

    var movementX = typeof event.movementX === 'number' ? event.movementX : typeof event.mozMovementX === 'number' ? event.mozMovementX : typeof event.getMovementX === 'function' ? event.getMovementX() : 0;
    var movementY = typeof event.movementY === 'number' ? event.movementY : typeof event.mozMovementY === 'number' ? event.mozMovementY : typeof event.getMovementY === 'function' ? event.getMovementY() : 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    pitchObject.rotation.x = Math.max(-PI_2, Math.min(PI_2, pitchObject.rotation.x));
  };

  var physics = player.use('physics');

  var onKeyDown = function onKeyDown(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = true;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = true;
        break;

      case 40: // down
      case 83:
        // s
        moveBackward = true;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = true;
        break;

      case 32:
        // space
        console.log(canJump);
        if (canJump === true) physics.applyCentralImpulse({ x: 0, y: 300, z: 0 });
        canJump = false;
        break;

      case 16:
        // shift
        runVelocity = 0.5;
        break;

      default:
    }
  };

  var onKeyUp = function onKeyUp(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = false;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = false;
        break;

      case 40: // down
      case 83:
        // a
        moveBackward = false;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = false;
        break;

      case 16:
        // shift
        runVelocity = 0.25;
        break;

      default:
    }
  };

  document.body.addEventListener('mousemove', onMouseMove, false);
  document.body.addEventListener('keydown', onKeyDown, false);
  document.body.addEventListener('keyup', onKeyUp, false);

  this.enabled = false;
  this.getObject = function () {
    return yawObject;
  };

  this.getDirection = function (targetVec) {
    targetVec.set(0, 0, -1);
    quat.multiplyVector3(targetVec);
  };

  // Moves the camera to the Physi.js object position
  // and adds velocity to the object if the run key is down.
  var inputVelocity = new Vector3$1(),
      euler = new Euler();

  this.update = function (delta) {
    if (_this.enabled === false) return;

    delta = delta || 0.5;
    delta = Math.min(delta, 0.5, delta);

    inputVelocity.set(0, 0, 0);

    var speed = velocityFactor * delta * params.speed * runVelocity;

    if (moveForward) inputVelocity.z = -speed;
    if (moveBackward) inputVelocity.z = speed;
    if (moveLeft) inputVelocity.x = -speed;
    if (moveRight) inputVelocity.x = speed;

    // Convert velocity to world coordinates
    euler.x = pitchObject.rotation.x;
    euler.y = yawObject.rotation.y;
    euler.order = 'XYZ';

    quat.setFromEuler(euler);

    inputVelocity.applyQuaternion(quat);

    physics.applyCentralImpulse({ x: inputVelocity.x, y: 0, z: inputVelocity.z });
    physics.setAngularVelocity({ x: inputVelocity.z, y: 0, z: -inputVelocity.x });
    physics.setAngularFactor({ x: 0, y: 0, z: 0 });
  };

  player.on('physics:added', function () {
    player.manager.get('module:world').addEventListener('update', function () {
      if (_this.enabled === false) return;
      yawObject.position.copy(player.position);
    });
  });
}

var FirstPersonModule = (_temp$1 = _class$2 = function () {
  function FirstPersonModule(object) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, FirstPersonModule);

    this.object = object;
    this.params = params;

    if (!this.params.block) {
      this.params.block = document.getElementById('blocker');
    }
  }

  createClass(FirstPersonModule, [{
    key: 'manager',
    value: function manager(_manager) {
      var _this2 = this;

      this.controls = new FirstPersonControlsSolver(_manager.get('camera'), this.object, this.params);

      if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
        var element = document.body;

        var pointerlockchange = function pointerlockchange() {
          if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            _this2.controls.enabled = true;
            _this2.params.block.style.display = 'none';
          } else {
            _this2.controls.enabled = false;
            _this2.params.block.style.display = 'block';
          }
        };

        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

        var pointerlockerror = function pointerlockerror() {
          console.warn('Pointer lock error.');
        };

        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        document.querySelector('body').addEventListener('click', function () {
          element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

          element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

          if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function fullscreenchange() {
              if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                document.removeEventListener('fullscreenchange', fullscreenchange);
                document.removeEventListener('mozfullscreenchange', fullscreenchange);

                element.requestPointerLock();
              }
            };

            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);

            element.requestFullscreen();
          } else element.requestPointerLock();
        });
      } else console.warn('Your browser does not support the PointerLock');

      _manager.get('scene').add(this.controls.getObject());
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var updateProcessor = function updateProcessor(c) {
        self.controls.update(c.getDelta());
      };

      self.updateLoop = new Loop(updateProcessor).start(this);
    }
  }]);
  return FirstPersonModule;
}(), _class$2.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp$1);

var _class$3, _temp$2;

var PI_2$1 = Math.PI / 2;
var direction = new THREE.Vector3();
var impulse_length = 1;

function range_scale(input, init_low, init_high, final_low, final_high) {
  return (input - init_low) * (final_high - final_low) / (init_high - init_low) + final_low;
}

// TODO: Fix DOM
function ThirdPersonControlsSolver(camera, mesh, params) {
  var _this = this;

  var velocityFactor = 1;
  var runVelocity = 0.25;

  mesh.use('physics').setAngularFactor({ x: 0, y: 0, z: 0 });
  camera.position.set(0, 0, 15);
  //camera.native.lookAt(mesh);

  /* Init */
  var player = mesh,
      pitchObject = new Object3D();

  pitchObject.add(camera.native);

  var yawObject = new Object3D();

  yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
  yawObject.add(pitchObject);

  var quat = new Quaternion();

  var canJump = false,

  // Moves.
  moveForward = false,
      moveBackward = false,
      moveLeft = false,
      moveRight = false;

  player.on('collision', function (otherObject, v, r, contactNormal) {
    console.log(contactNormal.y);
    if (contactNormal.y < 0.5) {
      canJump = true;
    }
  });

  var onMouseMove = function onMouseMove(event) {
    if (_this.enabled === false) return;

    var movementX = typeof event.movementX === 'number' ? event.movementX : typeof event.mozMovementX === 'number' ? event.mozMovementX : typeof event.getMovementX === 'function' ? event.getMovementX() : 0;
    var movementY = typeof event.movementY === 'number' ? event.movementY : typeof event.mozMovementY === 'number' ? event.mozMovementY : typeof event.getMovementY === 'function' ? event.getMovementY() : 0;

    yawObject.rotation.y -= movementX * 0.002;
    pitchObject.rotation.x -= movementY * 0.002;

    //yawObject.rotation.y = Math.max(-Math.PI, Math.min(Math.PI, yawObject.rotation.y));
    pitchObject.rotation.x = Math.max(-PI_2$1, Math.min(PI_2$1, pitchObject.rotation.x));
  };

  var physics = player.use('physics');

  var onKeyDown = function onKeyDown(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = true;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = true;
        break;

      case 40: // down
      case 83:
        // s
        moveBackward = true;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = true;
        break;

      case 32:
        // space
        console.log(canJump);
        if (canJump === true) physics.applyCentralImpulse({ x: 0, y: 300, z: 0 });
        canJump = false;
        break;

      case 16:
        // shift
        runVelocity = 0.5;
        break;

      default:
    }
  };

  var onKeyUp = function onKeyUp(event) {
    switch (event.keyCode) {
      case 38: // up
      case 87:
        // w
        moveForward = false;
        break;

      case 37: // left
      case 65:
        // a
        moveLeft = false;
        break;

      case 40: // down
      case 83:
        // a
        moveBackward = false;
        break;

      case 39: // right
      case 68:
        // d
        moveRight = false;
        break;

      case 16:
        // shift
        runVelocity = 0.25;
        break;

      default:
    }
  };

  document.body.addEventListener('mousemove', onMouseMove, false);
  document.body.addEventListener('keydown', onKeyDown, false);
  document.body.addEventListener('keyup', onKeyUp, false);

  this.enabled = false;
  this.getObject = function () {
    return yawObject;
  };

  this.getDirection = function (targetVec) {
    targetVec.set(0, 0, -1);
    quat.multiplyVector3(targetVec);
  };

  // Moves the camera to the Physi.js object position
  // and adds velocity to the object if the run key is down.
  var inputVelocity = new Vector3$1(),
      euler = new Euler();

  this.update = function (delta) {
    if (_this.enabled === false) return;

    delta = delta || 0.5;
    delta = Math.min(delta, 0.5, delta);

    inputVelocity.set(0, 0, 0);

    direction = camera.native.getWorldDirection(direction);
    var angle = THREE.Math.radToDeg(Math.atan(direction.y));
    angle = range_scale(angle, -45, 45, -90, 90);
    var radians = THREE.Math.degToRad(angle);

    var speed = velocityFactor * delta * params.speed * runVelocity;
    direction.normalize();

    if (moveForward || moveBackward) {
      var dt = moveForward ? -1 : 1;
      inputVelocity.y = -dt * speed * Math.sin(radians) * impulse_length;
      inputVelocity.z = dt * speed * Math.cos(radians) * impulse_length;
    }

    if (moveLeft || moveRight) {
      var _dt = moveLeft ? -1 : 1;
      inputVelocity.x = _dt * speed * impulse_length;
    }

    if (inputVelocity.x || inputVelocity.y || inputVelocity.z) {
      inputVelocity.applyQuaternion(yawObject.quaternion);
      physics.applyCentralImpulse({ x: inputVelocity.x, y: inputVelocity.y, z: inputVelocity.z });
    }
  };

  player.on('physics:added', function () {
    player.use("physics").setDamping(.6, 0);
    player.manager.get('module:world').addEventListener('update', function () {
      if (_this.enabled === false) return;
      yawObject.position.copy(player.position);
    });
  });
}

var ThirdPersonModule = (_temp$2 = _class$3 = function () {
  function ThirdPersonModule(object) {
    var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    classCallCheck(this, ThirdPersonModule);

    this.object = object;
    this.params = params;

    if (!this.params.block) {
      this.params.block = document.getElementById('blocker');
    }
  }

  createClass(ThirdPersonModule, [{
    key: 'manager',
    value: function manager(_manager) {
      var _this2 = this;

      this.controls = new ThirdPersonControlsSolver(_manager.get('camera'), this.object, this.params);

      if ('pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document) {
        var element = document.body;

        var pointerlockchange = function pointerlockchange() {
          if (document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element) {
            _this2.controls.enabled = true;
            _this2.params.block.style.display = 'none';
          } else {
            _this2.controls.enabled = false;
            _this2.params.block.style.display = 'block';
          }
        };

        document.addEventListener('pointerlockchange', pointerlockchange, false);
        document.addEventListener('mozpointerlockchange', pointerlockchange, false);
        document.addEventListener('webkitpointerlockchange', pointerlockchange, false);

        var pointerlockerror = function pointerlockerror() {
          console.warn('Pointer lock error.');
        };

        document.addEventListener('pointerlockerror', pointerlockerror, false);
        document.addEventListener('mozpointerlockerror', pointerlockerror, false);
        document.addEventListener('webkitpointerlockerror', pointerlockerror, false);

        document.querySelector('body').addEventListener('click', function () {
          element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;

          element.requestFullscreen = element.requestFullscreen || element.mozRequestFullscreen || element.mozRequestFullScreen || element.webkitRequestFullscreen;

          if (/Firefox/i.test(navigator.userAgent)) {
            var fullscreenchange = function fullscreenchange() {
              if (document.fullscreenElement === element || document.mozFullscreenElement === element || document.mozFullScreenElement === element) {
                document.removeEventListener('fullscreenchange', fullscreenchange);
                document.removeEventListener('mozfullscreenchange', fullscreenchange);

                element.requestPointerLock();
              }
            };

            document.addEventListener('fullscreenchange', fullscreenchange, false);
            document.addEventListener('mozfullscreenchange', fullscreenchange, false);

            element.requestFullscreen();
          } else element.requestPointerLock();
        });
      } else console.warn('Your browser does not support the PointerLock');

      _manager.get('scene').add(this.controls.getObject());
    }
  }, {
    key: 'integrate',
    value: function integrate(self) {
      var updateProcessor = function updateProcessor(c) {
        self.controls.update(c.getDelta());
      };

      self.updateLoop = new Loop(updateProcessor).start(this);
    }
  }]);
  return ThirdPersonModule;
}(), _class$3.defaults = {
  block: null,
  speed: 1,
  ypos: 1
}, _temp$2);

export { getEulerXYZFromQuaternion, getQuatertionFromEuler, convertWorldPositionToObject, addObjectChildren, MESSAGE_TYPES, REPORT_ITEMSIZE, COLLISIONREPORT_ITEMSIZE, VEHICLEREPORT_ITEMSIZE, CONSTRAINTREPORT_ITEMSIZE, temp1Vector3, temp2Vector3, temp1Matrix4, temp1Quat, Eventable, ConeTwistConstraint, HingeConstraint, PointConstraint, SliderConstraint, DOFConstraint, WorldModule, BoxModule, CompoundModule, CapsuleModule, ConcaveModule, ConeModule, ConvexModule, CylinderModule, HeightfieldModule, PlaneModule, SphereModule, SoftbodyModule, ClothModule, RopeModule, FirstPersonModule, ThirdPersonModule };
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUubW9kdWxlLmpzLm1hcCIsInNvdXJjZXMiOlsiLi4vc3JjL2FwaS5qcyIsIi4uL3NyYy9ldmVudGFibGUuanMiLCIuLi9zcmMvY29uc3RyYWludHMvQ29uZVR3aXN0Q29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9IaW5nZUNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvUG9pbnRDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL1NsaWRlckNvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvRE9GQ29uc3RyYWludC5qcyIsIi4uL3NyYy92ZWhpY2xlL3ZlaGljbGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb3JlL1dvcmxkTW9kdWxlQmFzZS5qcyIsIi4uL2J1bmRsZS13b3JrZXIvd29ya2VyaGVscGVyLmpzIiwiLi4vc3JjL3dvcmtlci5qcyIsIi4uL3NyYy9tb2R1bGVzL1dvcmxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29yZS9QaHlzaWNzTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQm94TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29tcG91bmRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DYXBzdWxlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uY2F2ZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db252ZXhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9DeWxpbmRlck1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0hlaWdodGZpZWxkTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUGxhbmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9TcGhlcmVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Tb2Z0Ym9keU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0Nsb3RoTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvUm9wZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvbnRyb2xzL0ZpcnN0UGVyc29uTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvVGhpcmRQZXJzb25Nb2R1bGUuanMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgVmVjdG9yMyxcbiAgTWF0cml4NCxcbiAgUXVhdGVybmlvblxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbmNvbnN0IFJFUE9SVF9JVEVNU0laRSA9IDE0LFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSxcbiAgQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSA9IDY7XG5cbmNvbnN0IHRlbXAxVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAyVmVjdG9yMyA9IG5ldyBWZWN0b3IzKCksXG4gIHRlbXAxTWF0cml4NCA9IG5ldyBNYXRyaXg0KCksXG4gIHRlbXAxUXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbmNvbnN0IGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24gPSAoeCwgeSwgeiwgdykgPT4ge1xuICByZXR1cm4gbmV3IFZlY3RvcjMoXG4gICAgTWF0aC5hdGFuMigyICogKHggKiB3IC0geSAqIHopLCAodyAqIHcgLSB4ICogeCAtIHkgKiB5ICsgeiAqIHopKSxcbiAgICBNYXRoLmFzaW4oMiAqICh4ICogeiArIHkgKiB3KSksXG4gICAgTWF0aC5hdGFuMigyICogKHogKiB3IC0geCAqIHkpLCAodyAqIHcgKyB4ICogeCAtIHkgKiB5IC0geiAqIHopKVxuICApO1xufTtcblxuY29uc3QgZ2V0UXVhdGVydGlvbkZyb21FdWxlciA9ICh4LCB5LCB6KSA9PiB7XG4gIGNvbnN0IGMxID0gTWF0aC5jb3MoeSk7XG4gIGNvbnN0IHMxID0gTWF0aC5zaW4oeSk7XG4gIGNvbnN0IGMyID0gTWF0aC5jb3MoLXopO1xuICBjb25zdCBzMiA9IE1hdGguc2luKC16KTtcbiAgY29uc3QgYzMgPSBNYXRoLmNvcyh4KTtcbiAgY29uc3QgczMgPSBNYXRoLnNpbih4KTtcbiAgY29uc3QgYzFjMiA9IGMxICogYzI7XG4gIGNvbnN0IHMxczIgPSBzMSAqIHMyO1xuXG4gIHJldHVybiB7XG4gICAgdzogYzFjMiAqIGMzIC0gczFzMiAqIHMzLFxuICAgIHg6IGMxYzIgKiBzMyArIHMxczIgKiBjMyxcbiAgICB5OiBzMSAqIGMyICogYzMgKyBjMSAqIHMyICogczMsXG4gICAgejogYzEgKiBzMiAqIGMzIC0gczEgKiBjMiAqIHMzXG4gIH07XG59O1xuXG5jb25zdCBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0ID0gKHBvc2l0aW9uLCBvYmplY3QpID0+IHtcbiAgdGVtcDFNYXRyaXg0LmlkZW50aXR5KCk7IC8vIHJlc2V0IHRlbXAgbWF0cml4XG5cbiAgLy8gU2V0IHRoZSB0ZW1wIG1hdHJpeCdzIHJvdGF0aW9uIHRvIHRoZSBvYmplY3QncyByb3RhdGlvblxuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKS5tYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbihvYmplY3QucXVhdGVybmlvbik7XG5cbiAgLy8gSW52ZXJ0IHJvdGF0aW9uIG1hdHJpeCBpbiBvcmRlciB0byBcInVucm90YXRlXCIgYSBwb2ludCBiYWNrIHRvIG9iamVjdCBzcGFjZVxuICB0ZW1wMU1hdHJpeDQuZ2V0SW52ZXJzZSh0ZW1wMU1hdHJpeDQpO1xuXG4gIC8vIFlheSEgVGVtcCB2YXJzIVxuICB0ZW1wMVZlY3RvcjMuY29weShwb3NpdGlvbik7XG4gIHRlbXAyVmVjdG9yMy5jb3B5KG9iamVjdC5wb3NpdGlvbik7XG5cbiAgLy8gQXBwbHkgdGhlIHJvdGF0aW9uXG4gIHJldHVybiB0ZW1wMVZlY3RvcjMuc3ViKHRlbXAyVmVjdG9yMykuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG59O1xuXG5jb25zdCBhZGRPYmplY3RDaGlsZHJlbiA9IGZ1bmN0aW9uIChwYXJlbnQsIG9iamVjdCkge1xuICBmb3IgKGxldCBpID0gMDsgaSA8IG9iamVjdC5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgIGNvbnN0IGNoaWxkID0gb2JqZWN0LmNoaWxkcmVuW2ldO1xuICAgIGNvbnN0IHBoeXNpY3MgPSBjaGlsZC5jb21wb25lbnQgPyBjaGlsZC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykgOiBmYWxzZTtcblxuICAgIGlmIChwaHlzaWNzKSB7XG4gICAgICBjb25zdCBkYXRhID0gcGh5c2ljcy5kYXRhO1xuXG4gICAgICBjaGlsZC51cGRhdGVNYXRyaXgoKTtcbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeFdvcmxkKCk7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXRGcm9tTWF0cml4UG9zaXRpb24oY2hpbGQubWF0cml4V29ybGQpO1xuICAgICAgdGVtcDFRdWF0LnNldEZyb21Sb3RhdGlvbk1hdHJpeChjaGlsZC5tYXRyaXhXb3JsZCk7XG5cbiAgICAgIGRhdGEucG9zaXRpb25fb2Zmc2V0ID0ge1xuICAgICAgICB4OiB0ZW1wMVZlY3RvcjMueCxcbiAgICAgICAgeTogdGVtcDFWZWN0b3IzLnksXG4gICAgICAgIHo6IHRlbXAxVmVjdG9yMy56XG4gICAgICB9O1xuXG4gICAgICBkYXRhLnJvdGF0aW9uID0ge1xuICAgICAgICB4OiB0ZW1wMVF1YXQueCxcbiAgICAgICAgeTogdGVtcDFRdWF0LnksXG4gICAgICAgIHo6IHRlbXAxUXVhdC56LFxuICAgICAgICB3OiB0ZW1wMVF1YXQud1xuICAgICAgfTtcblxuICAgICAgcGFyZW50LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhLmNoaWxkcmVuLnB1c2goZGF0YSk7XG4gICAgfVxuXG4gICAgYWRkT2JqZWN0Q2hpbGRyZW4ocGFyZW50LCBjaGlsZCk7XG4gIH1cbn07XG5cbmV4cG9ydCB7XG4gIGdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24sXG4gIGdldFF1YXRlcnRpb25Gcm9tRXVsZXIsXG4gIGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QsXG4gIGFkZE9iamVjdENoaWxkcmVuLFxuXG4gIE1FU1NBR0VfVFlQRVMsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFLFxuXG4gIHRlbXAxVmVjdG9yMyxcbiAgdGVtcDJWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIHRlbXAxUXVhdFxufTtcbiIsImV4cG9ydCBjbGFzcyBFdmVudGFibGUge1xuICBjb25zdHJ1Y3RvcigpIHtcbiAgICB0aGlzLl9ldmVudExpc3RlbmVycyA9IHt9O1xuICB9XG5cbiAgYWRkRXZlbnRMaXN0ZW5lcihldmVudF9uYW1lLCBjYWxsYmFjaykge1xuICAgIGlmICghdGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpXG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXSA9IFtdO1xuXG4gICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ucHVzaChjYWxsYmFjayk7XG4gIH1cblxuICByZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgbGV0IGluZGV4O1xuXG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSkgcmV0dXJuIGZhbHNlO1xuXG4gICAgaWYgKChpbmRleCA9IHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLmluZGV4T2YoY2FsbGJhY2spKSA+PSAwKSB7XG4gICAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgZGlzcGF0Y2hFdmVudChldmVudF9uYW1lKSB7XG4gICAgbGV0IGk7XG4gICAgY29uc3QgcGFyYW1ldGVycyA9IEFycmF5LnByb3RvdHlwZS5zcGxpY2UuY2FsbChhcmd1bWVudHMsIDEpO1xuXG4gICAgaWYgKHRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSB7XG4gICAgICBmb3IgKGkgPSAwOyBpIDwgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0ubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdW2ldLmFwcGx5KHRoaXMsIHBhcmFtZXRlcnMpO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRpYyBtYWtlKG9iaikge1xuICAgIG9iai5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUuYWRkRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXIgPSBFdmVudGFibGUucHJvdG90eXBlLnJlbW92ZUV2ZW50TGlzdGVuZXI7XG4gICAgb2JqLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50ID0gRXZlbnRhYmxlLnByb3RvdHlwZS5kaXNwYXRjaEV2ZW50O1xuICB9XG59XG4iLCJpbXBvcnQgeyBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0IH0gZnJvbSAnLi4vYXBpJztcbmltcG9ydCB7IEV1bGVyLCBNYXRyaXg0LCBRdWF0ZXJuaW9uLCBWZWN0b3IzIH0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZVR3aXN0Q29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgY29uc3Qgb2JqZWN0YiA9IG9iamE7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkgY29uc29sZS5lcnJvcignQm90aCBvYmplY3RzIG11c3QgYmUgZGVmaW5lZCBpbiBhIENvbmVUd2lzdENvbnN0cmFpbnQuJyk7XG5cbiAgICB0aGlzLnR5cGUgPSAnY29uZXR3aXN0JztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RhKS5jbG9uZSgpO1xuICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHt4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56fTtcbiAgICB0aGlzLmF4aXNiID0ge3g6IG9iamVjdGIucm90YXRpb24ueCwgeTogb2JqZWN0Yi5yb3RhdGlvbi55LCB6OiBvYmplY3RiLnJvdGF0aW9uLnp9O1xuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGltaXQoeCwgeSwgeikge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldExpbWl0Jywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIHgsIHksIHp9KTtcbiAgfVxuXG4gIGVuYWJsZU1vdG9yKCkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X2VuYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIHNldE1heE1vdG9ySW1wdWxzZShtYXhfaW1wdWxzZSkge1xuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZScsIHtjb25zdHJhaW50OiB0aGlzLmlkLCBtYXhfaW1wdWxzZX0pO1xuICB9XG5cbiAgc2V0TW90b3JUYXJnZXQodGFyZ2V0KSB7XG4gICAgaWYgKHRhcmdldCBpbnN0YW5jZW9mIFZlY3RvcjMpXG4gICAgICB0YXJnZXQgPSBuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihuZXcgRXVsZXIodGFyZ2V0LngsIHRhcmdldC55LCB0YXJnZXQueikpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIEV1bGVyKVxuICAgICAgdGFyZ2V0ID0gbmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIodGFyZ2V0KTtcbiAgICBlbHNlIGlmICh0YXJnZXQgaW5zdGFuY2VvZiBNYXRyaXg0KVxuICAgICAgdGFyZ2V0ID0gbmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tUm90YXRpb25NYXRyaXgodGFyZ2V0KTtcblxuICAgIGlmKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Jywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHg6IHRhcmdldC54LFxuICAgICAgeTogdGFyZ2V0LnksXG4gICAgICB6OiB0YXJnZXQueixcbiAgICAgIHc6IHRhcmdldC53XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIEhpbmdlQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uLCBheGlzKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKGF4aXMgPT09IHVuZGVmaW5lZCkge1xuICAgICAgYXhpcyA9IHBvc2l0aW9uO1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnaGluZ2UnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5wb3NpdGlvbiA9IHBvc2l0aW9uLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobG93LCBoaWdoLCBiaWFzX2ZhY3RvciwgcmVsYXhhdGlvbl9mYWN0b3IpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9zZXRMaW1pdHMnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgbG93LFxuICAgICAgaGlnaCxcbiAgICAgIGJpYXNfZmFjdG9yLFxuICAgICAgcmVsYXhhdGlvbl9mYWN0b3JcbiAgICB9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnaGluZ2VfZGlzYWJsZU1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgUG9pbnRDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAocG9zaXRpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAncG9pbnQnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG5cbiAgICBpZiAob2JqZWN0Yikge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KHBvc2l0aW9uLCBvYmplY3RiKS5jbG9uZSgpO1xuICAgIH1cbiAgfVxuXG4gIGdldERlZmluaXRpb24oKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHR5cGU6IHRoaXMudHlwZSxcbiAgICAgIGlkOiB0aGlzLmlkLFxuICAgICAgb2JqZWN0YTogdGhpcy5vYmplY3RhLFxuICAgICAgb2JqZWN0YjogdGhpcy5vYmplY3RiLFxuICAgICAgcG9zaXRpb25hOiB0aGlzLnBvc2l0aW9uYSxcbiAgICAgIHBvc2l0aW9uYjogdGhpcy5wb3NpdGlvbmJcbiAgICB9O1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBTbGlkZXJDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdzbGlkZXInO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5heGlzID0gYXhpcztcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXM6IHRoaXMuYXhpc1xuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdHMobGluX2xvd2VyLCBsaW5fdXBwZXIsIGFuZ19sb3dlciwgYW5nX3VwcGVyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX3NldExpbWl0cycsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICBsaW5fbG93ZXIsXG4gICAgICBsaW5fdXBwZXIsXG4gICAgICBhbmdfbG93ZXIsXG4gICAgICBhbmdfdXBwZXJcbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlc3RpdHV0aW9uKGxpbmVhciwgYW5ndWxhcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoXG4gICAgICAnc2xpZGVyX3NldFJlc3RpdHV0aW9uJyxcbiAgICAgIHtcbiAgICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgICAgbGluZWFyLFxuICAgICAgICBhbmd1bGFyXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGVuYWJsZUxpbmVhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlTGluZWFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVMaW5lYXJNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxuXG4gIGVuYWJsZUFuZ3VsYXJNb3Rvcih2ZWxvY2l0eSwgYWNjZWxlcmF0aW9uKSB7XG4gICAgdGhpcy5zY2VuZS5leGVjdXRlKCdzbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIHZlbG9jaXR5LFxuICAgICAgYWNjZWxlcmF0aW9uXG4gICAgfSk7XG4gIH1cblxuICBkaXNhYmxlQW5ndWxhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yJywge2NvbnN0cmFpbnQ6IHRoaXMuaWR9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgRE9GQ29uc3RyYWludCB7XG4gIGNvbnN0cnVjdG9yKG9iamEsIG9iamIsIHBvc2l0aW9uKSB7XG4gICAgY29uc3Qgb2JqZWN0YSA9IG9iamE7XG4gICAgbGV0IG9iamVjdGIgPSBvYmpiO1xuXG4gICAgaWYgKCBwb3NpdGlvbiA9PT0gdW5kZWZpbmVkICkge1xuICAgICAgcG9zaXRpb24gPSBvYmplY3RiO1xuICAgICAgb2JqZWN0YiA9IHVuZGVmaW5lZDtcbiAgICB9XG5cbiAgICB0aGlzLnR5cGUgPSAnZG9mJztcbiAgICB0aGlzLmFwcGxpZWRJbXB1bHNlID0gMDtcbiAgICB0aGlzLndvcmxkTW9kdWxlID0gbnVsbDsgLy8gV2lsbCBiZSByZWRlZmluZWQgYnkgLmFkZENvbnN0cmFpbnRcbiAgICB0aGlzLm9iamVjdGEgPSBvYmplY3RhLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgdGhpcy5wb3NpdGlvbmEgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YSApLmNsb25lKCk7XG4gICAgdGhpcy5heGlzYSA9IHsgeDogb2JqZWN0YS5yb3RhdGlvbi54LCB5OiBvYmplY3RhLnJvdGF0aW9uLnksIHo6IG9iamVjdGEucm90YXRpb24ueiB9O1xuXG4gICAgaWYgKCBvYmplY3RiICkge1xuICAgICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgICAgdGhpcy5wb3NpdGlvbmIgPSBjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0KCBwb3NpdGlvbiwgb2JqZWN0YiApLmNsb25lKCk7XG4gICAgICB0aGlzLmF4aXNiID0geyB4OiBvYmplY3RiLnJvdGF0aW9uLngsIHk6IG9iamVjdGIucm90YXRpb24ueSwgejogb2JqZWN0Yi5yb3RhdGlvbi56IH07XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYixcbiAgICAgIGF4aXNhOiB0aGlzLmF4aXNhLFxuICAgICAgYXhpc2I6IHRoaXMuYXhpc2JcbiAgICB9O1xuICB9XG5cbiAgc2V0TGluZWFyTG93ZXJMaW1pdChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyTG93ZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRMaW5lYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0TGluZWFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBzZXRBbmd1bGFyTG93ZXJMaW1pdCAobGltaXQpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJVcHBlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yICh3aGljaCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfZW5hYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG5cbiAgY29uZmlndXJlQW5ndWxhck1vdG9yICh3aGljaCwgbG93X2FuZ2xlLCBoaWdoX2FuZ2xlLCB2ZWxvY2l0eSwgbWF4X2ZvcmNlICkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2gsIGxvd19hbmdsZTogbG93X2FuZ2xlLCBoaWdoX2FuZ2xlOiBoaWdoX2FuZ2xlLCB2ZWxvY2l0eTogdmVsb2NpdHksIG1heF9mb3JjZTogbWF4X2ZvcmNlIH0gKTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9kaXNhYmxlQW5ndWxhck1vdG9yJywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB3aGljaDogd2hpY2ggfSApO1xuICB9XG59XG4iLCJpbXBvcnQge01lc2h9IGZyb20gJ3RocmVlJztcbmltcG9ydCB7VmVoaWNsZVR1bm5pbmd9IGZyb20gJy4vdHVubmluZyc7XG5cbmV4cG9ydCBjbGFzcyBWZWhpY2xlIHtcbiAgY29uc3RydWN0b3IobWVzaCwgdHVuaW5nID0gbmV3IFZlaGljbGVUdW5pbmcoKSkge1xuICAgIHRoaXMubWVzaCA9IG1lc2g7XG4gICAgdGhpcy53aGVlbHMgPSBbXTtcblxuICAgIHRoaXMuX3BoeXNpanMgPSB7XG4gICAgICBpZDogZ2V0T2JqZWN0SWQoKSxcbiAgICAgIHJpZ2lkQm9keTogbWVzaC5fcGh5c2lqcy5pZCxcbiAgICAgIHN1c3BlbnNpb25fc3RpZmZuZXNzOiB0dW5pbmcuc3VzcGVuc2lvbl9zdGlmZm5lc3MsXG4gICAgICBzdXNwZW5zaW9uX2NvbXByZXNzaW9uOiB0dW5pbmcuc3VzcGVuc2lvbl9jb21wcmVzc2lvbixcbiAgICAgIHN1c3BlbnNpb25fZGFtcGluZzogdHVuaW5nLnN1c3BlbnNpb25fZGFtcGluZyxcbiAgICAgIG1heF9zdXNwZW5zaW9uX3RyYXZlbDogdHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCxcbiAgICAgIGZyaWN0aW9uX3NsaXA6IHR1bmluZy5mcmljdGlvbl9zbGlwLFxuICAgICAgbWF4X3N1c3BlbnNpb25fZm9yY2U6IHR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZVxuICAgIH07XG4gIH1cblxuICBhZGRXaGVlbCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwsIGNvbm5lY3Rpb25fcG9pbnQsIHdoZWVsX2RpcmVjdGlvbiwgd2hlZWxfYXhsZSwgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCwgd2hlZWxfcmFkaXVzLCBpc19mcm9udF93aGVlbCwgdHVuaW5nKSB7XG4gICAgY29uc3Qgd2hlZWwgPSBuZXcgTWVzaCh3aGVlbF9nZW9tZXRyeSwgd2hlZWxfbWF0ZXJpYWwpO1xuXG4gICAgd2hlZWwuY2FzdFNoYWRvdyA9IHdoZWVsLnJlY2VpdmVTaGFkb3cgPSB0cnVlO1xuICAgIHdoZWVsLnBvc2l0aW9uLmNvcHkod2hlZWxfZGlyZWN0aW9uKS5tdWx0aXBseVNjYWxhcihzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIC8gMTAwKS5hZGQoY29ubmVjdGlvbl9wb2ludCk7XG5cbiAgICB0aGlzLndvcmxkLmFkZCh3aGVlbCk7XG4gICAgdGhpcy53aGVlbHMucHVzaCh3aGVlbCk7XG5cbiAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FkZFdoZWVsJywge1xuICAgICAgaWQ6IHRoaXMuX3BoeXNpanMuaWQsXG4gICAgICBjb25uZWN0aW9uX3BvaW50OiB7eDogY29ubmVjdGlvbl9wb2ludC54LCB5OiBjb25uZWN0aW9uX3BvaW50LnksIHo6IGNvbm5lY3Rpb25fcG9pbnQuen0sXG4gICAgICB3aGVlbF9kaXJlY3Rpb246IHt4OiB3aGVlbF9kaXJlY3Rpb24ueCwgeTogd2hlZWxfZGlyZWN0aW9uLnksIHo6IHdoZWVsX2RpcmVjdGlvbi56fSxcbiAgICAgIHdoZWVsX2F4bGU6IHt4OiB3aGVlbF9heGxlLngsIHk6IHdoZWVsX2F4bGUueSwgejogd2hlZWxfYXhsZS56fSxcbiAgICAgIHN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICB3aGVlbF9yYWRpdXMsXG4gICAgICBpc19mcm9udF93aGVlbCxcbiAgICAgIHR1bmluZ1xuICAgIH0pO1xuICB9XG5cbiAgc2V0U3RlZXJpbmcoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRTdGVlcmluZycsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIHN0ZWVyaW5nOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIHNldEJyYWtlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0QnJha2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsLCBicmFrZTogYW1vdW50fSk7XG4gICAgZWxzZSBpZiAodGhpcy53aGVlbHMubGVuZ3RoID4gMCkge1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLndoZWVscy5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGJyYWtlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cblxuICBhcHBseUVuZ2luZUZvcmNlKGFtb3VudCwgd2hlZWwpIHtcbiAgICBpZiAod2hlZWwgIT09IHVuZGVmaW5lZCAmJiB0aGlzLndoZWVsc1t3aGVlbF0gIT09IHVuZGVmaW5lZClcbiAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGZvcmNlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ2FwcGx5RW5naW5lRm9yY2UnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBmb3JjZTogYW1vdW50fSk7XG4gICAgfVxuICB9XG59XG4iLCJpbXBvcnQge1xuICBTY2VuZSBhcyBTY2VuZU5hdGl2ZSxcbiAgTWVzaCxcbiAgU3BoZXJlR2VvbWV0cnksXG4gIE1lc2hOb3JtYWxNYXRlcmlhbCxcbiAgQm94R2VvbWV0cnksXG4gIFZlY3RvcjNcbn0gZnJvbSAndGhyZWUnO1xuXG5pbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7VmVoaWNsZX0gZnJvbSAnLi4vLi4vdmVoaWNsZS92ZWhpY2xlJztcbmltcG9ydCB7RXZlbnRhYmxlfSBmcm9tICcuLi8uLi9ldmVudGFibGUnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uLy4uL2FwaSc7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFdvcmxkTW9kdWxlQmFzZSBleHRlbmRzIEV2ZW50YWJsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBmaXhlZFRpbWVTdGVwOiAxLzYwLFxuICAgIHJhdGVMaW1pdDogdHJ1ZSxcbiAgICBhbW1vOiBcIlwiLFxuICAgIHNvZnRib2R5OiBmYWxzZSxcbiAgICBncmF2aXR5OiBuZXcgVmVjdG9yMygwLCAxMDAsIDApXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob3B0aW9ucykge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLm9wdGlvbnMgPSBPYmplY3QuYXNzaWduKFdvcmxkTW9kdWxlQmFzZS5kZWZhdWx0cywgb3B0aW9ucyk7XG5cbiAgICB0aGlzLm9iamVjdHMgPSB7fTtcbiAgICB0aGlzLnZlaGljbGVzID0ge307XG4gICAgdGhpcy5jb25zdHJhaW50cyA9IHt9O1xuICAgIHRoaXMuaXNTaW11bGF0aW5nID0gZmFsc2U7XG5cbiAgICB0aGlzLmdldE9iamVjdElkID0gKCgpID0+IHtcbiAgICAgIGxldCBpZCA9IDE7XG4gICAgICByZXR1cm4gKCkgPT4ge1xuICAgICAgICByZXR1cm4gaWQrKztcbiAgICAgIH07XG4gICAgfSkoKTtcbiAgfVxuXG4gIHNldHVwKCkge1xuICAgIHRoaXMucmVjZWl2ZShldmVudCA9PiB7XG4gICAgICBsZXQgX3RlbXAsXG4gICAgICAgIGRhdGEgPSBldmVudC5kYXRhO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEFycmF5QnVmZmVyICYmIGRhdGEuYnl0ZUxlbmd0aCAhPT0gMSkvLyBieXRlTGVuZ3RoID09PSAxIGlzIHRoZSB3b3JrZXIgbWFraW5nIGEgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgdGVzdFxuICAgICAgICBkYXRhID0gbmV3IEZsb2F0MzJBcnJheShkYXRhKTtcblxuICAgICAgaWYgKGRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAgICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgICAgICBzd2l0Y2ggKGRhdGFbMF0pIHtcbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVNjZW5lKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU29mdGJvZGllcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRhdGEuY21kKSB7XG4gICAgICAgIC8vIG5vbi10cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YS5jbWQpIHtcbiAgICAgICAgICBjYXNlICdvYmplY3RSZWFkeSc6XG4gICAgICAgICAgICBfdGVtcCA9IGRhdGEucGFyYW1zO1xuICAgICAgICAgICAgaWYgKHRoaXMub2JqZWN0c1tfdGVtcF0pIHRoaXMub2JqZWN0c1tfdGVtcF0uZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnd29ybGRSZWFkeSc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3JlYWR5Jyk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgJ2FtbW9Mb2FkZWQnOlxuICAgICAgICAgICAgdGhpcy5kaXNwYXRjaEV2ZW50KCdsb2FkZWQnKTtcbiAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKFwiUGh5c2ljcyBsb2FkaW5nIHRpbWU6IFwiICsgKHBlcmZvcm1hbmNlLm5vdygpIC0gc3RhcnQpICsgXCJtc1wiKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAndmVoaWNsZSc6XG4gICAgICAgICAgICB3aW5kb3cudGVzdCA9IGRhdGE7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgICAgICAvLyBEbyBub3RoaW5nLCBqdXN0IHNob3cgdGhlIG1lc3NhZ2VcbiAgICAgICAgICAgIGNvbnNvbGUuZGVidWcoYFJlY2VpdmVkOiAke2RhdGEuY21kfWApO1xuICAgICAgICAgICAgY29uc29sZS5kaXIoZGF0YS5wYXJhbXMpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbGxpc2lvbnMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVWZWhpY2xlcyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdXBkYXRlU2NlbmUoaW5mbykge1xuICAgIGxldCBpbmRleCA9IGluZm9bMV07XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMiArIGluZGV4ICogUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2luZm9bb2Zmc2V0XV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAxXSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDJdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgM11cbiAgICAgICAgKTtcblxuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICB9XG5cbiAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID09PSBmYWxzZSkge1xuICAgICAgICBvYmplY3QucXVhdGVybmlvbi5zZXQoXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA0XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDVdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA3XVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgZGF0YS5saW5lYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOF0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgOV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTBdXG4gICAgICApO1xuXG4gICAgICBkYXRhLmFuZ3VsYXJWZWxvY2l0eS5zZXQoXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTFdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEyXSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxM11cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLnNlbmQoaW5mby5idWZmZXIsIFtpbmZvLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcblxuICAgIHRoaXMuaXNTaW11bGF0aW5nID0gZmFsc2U7XG4gICAgdGhpcy5kaXNwYXRjaEV2ZW50KCd1cGRhdGUnKTtcbiAgfVxuXG4gIHVwZGF0ZVNvZnRib2RpZXMoaW5mbykge1xuICAgIGxldCBpbmRleCA9IGluZm9bMV0sXG4gICAgICBvZmZzZXQgPSAyO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IHNpemUgPSBpbmZvW29mZnNldCArIDFdO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2luZm9bb2Zmc2V0XV07XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBjb25zdCBhdHRyaWJ1dGVzID0gb2JqZWN0Lmdlb21ldHJ5LmF0dHJpYnV0ZXM7XG4gICAgICBjb25zdCB2b2x1bWVQb3NpdGlvbnMgPSBhdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuXG4gICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgLy8gY29uc29sZS5sb2coZGF0YS5pZCk7XG4gICAgICBpZiAoIWRhdGEuaXNTb2Z0Qm9keVJlc2V0KSB7XG4gICAgICAgIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldCgwLCAwLCAwLCAwKTtcblxuICAgICAgICBkYXRhLmlzU29mdEJvZHlSZXNldCA9IHRydWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChkYXRhLnR5cGUgPT09IFwic29mdFRyaW1lc2hcIikge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgIGNvbnN0IHgxID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5MSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHoxID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueDEgPSBpbmZvW29mZnMgKyAzXTtcbiAgICAgICAgICBjb25zdCBueTEgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBuejEgPSBpbmZvW29mZnMgKyA1XTtcblxuICAgICAgICAgIGNvbnN0IHgyID0gaW5mb1tvZmZzICsgNl07XG4gICAgICAgICAgY29uc3QgeTIgPSBpbmZvW29mZnMgKyA3XTtcbiAgICAgICAgICBjb25zdCB6MiA9IGluZm9bb2ZmcyArIDhdO1xuXG4gICAgICAgICAgY29uc3QgbngyID0gaW5mb1tvZmZzICsgOV07XG4gICAgICAgICAgY29uc3QgbnkyID0gaW5mb1tvZmZzICsgMTBdO1xuICAgICAgICAgIGNvbnN0IG56MiA9IGluZm9bb2ZmcyArIDExXTtcblxuICAgICAgICAgIGNvbnN0IHgzID0gaW5mb1tvZmZzICsgMTJdO1xuICAgICAgICAgIGNvbnN0IHkzID0gaW5mb1tvZmZzICsgMTNdO1xuICAgICAgICAgIGNvbnN0IHozID0gaW5mb1tvZmZzICsgMTRdO1xuXG4gICAgICAgICAgY29uc3QgbngzID0gaW5mb1tvZmZzICsgMTVdO1xuICAgICAgICAgIGNvbnN0IG55MyA9IGluZm9bb2ZmcyArIDE2XTtcbiAgICAgICAgICBjb25zdCBuejMgPSBpbmZvW29mZnMgKyAxN107XG5cbiAgICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5XSA9IHgxO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDFdID0geTE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMl0gPSB6MTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDNdID0geDI7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNF0gPSB5MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA1XSA9IHoyO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgNl0gPSB4MztcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA3XSA9IHkzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDhdID0gejM7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5XSA9IG54MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMV0gPSBueTE7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDJdID0gbnoxO1xuXG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDNdID0gbngyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA0XSA9IG55MjtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNV0gPSBuejI7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgNl0gPSBueDM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDddID0gbnkzO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA4XSA9IG56MztcbiAgICAgICAgfVxuXG4gICAgICAgIGF0dHJpYnV0ZXMubm9ybWFsLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICAgICAgb2Zmc2V0ICs9IDIgKyBzaXplICogMTg7XG4gICAgICB9XG4gICAgICBlbHNlIGlmIChkYXRhLnR5cGUgPT09IFwic29mdFJvcGVNZXNoXCIpIHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiAzO1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG4gICAgICAgIH1cblxuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAzO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgdm9sdW1lTm9ybWFscyA9IGF0dHJpYnV0ZXMubm9ybWFsLmFycmF5O1xuXG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgY29uc3Qgb2ZmcyA9IG9mZnNldFZlcnQgKyBpICogNjtcblxuICAgICAgICAgIGNvbnN0IHggPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkgPSBpbmZvW29mZnMgKyAxXTtcbiAgICAgICAgICBjb25zdCB6ID0gaW5mb1tvZmZzICsgMl07XG5cbiAgICAgICAgICBjb25zdCBueCA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55ID0gaW5mb1tvZmZzICsgNF07XG4gICAgICAgICAgY29uc3QgbnogPSBpbmZvW29mZnMgKyA1XTtcblxuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogM10gPSB4O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDFdID0geTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaSAqIDMgKyAyXSA9IHo7XG5cbiAgICAgICAgICAvLyBGSVhNRTogTm9ybWFscyBhcmUgcG9pbnRlZCB0byBsb29rIGluc2lkZTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2kgKiAzXSA9IG54O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAxXSA9IG55O1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDMgKyAyXSA9IG56O1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiA2O1xuICAgICAgfVxuXG4gICAgICBhdHRyaWJ1dGVzLnBvc2l0aW9uLm5lZWRzVXBkYXRlID0gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAvLyAgIHRoaXMuc2VuZChpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgfVxuXG4gIHVwZGF0ZVZlaGljbGVzKGRhdGEpIHtcbiAgICBsZXQgdmVoaWNsZSwgd2hlZWw7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gVkVISUNMRVJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG4gICAgICB2ZWhpY2xlID0gdGhpcy52ZWhpY2xlc1tkYXRhW29mZnNldF1dO1xuXG4gICAgICBpZiAodmVoaWNsZSA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIHdoZWVsID0gdmVoaWNsZS53aGVlbHNbZGF0YVtvZmZzZXQgKyAxXV07XG5cbiAgICAgIHdoZWVsLnBvc2l0aW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgd2hlZWwucXVhdGVybmlvbi5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNV0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgN10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgOF1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLnNlbmQoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbnN0cmFpbnRzKGRhdGEpIHtcbiAgICBsZXQgY29uc3RyYWludCwgb2JqZWN0O1xuXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCAoZGF0YS5sZW5ndGggLSAxKSAvIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7IGkrKykge1xuICAgICAgY29uc3Qgb2Zmc2V0ID0gMSArIGkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3RyYWludCA9IHRoaXMuY29uc3RyYWludHNbZGF0YVtvZmZzZXRdXTtcbiAgICAgIG9iamVjdCA9IHRoaXMub2JqZWN0c1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgaWYgKGNvbnN0cmFpbnQgPT09IHVuZGVmaW5lZCB8fCBvYmplY3QgPT09IHVuZGVmaW5lZCkgY29udGludWU7XG5cbiAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgMl0sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgM10sXG4gICAgICAgIGRhdGFbb2Zmc2V0ICsgNF1cbiAgICAgICk7XG5cbiAgICAgIHRlbXAxTWF0cml4NC5leHRyYWN0Um90YXRpb24ob2JqZWN0Lm1hdHJpeCk7XG4gICAgICB0ZW1wMVZlY3RvcjMuYXBwbHlNYXRyaXg0KHRlbXAxTWF0cml4NCk7XG5cbiAgICAgIGNvbnN0cmFpbnQucG9zaXRpb25hLmFkZFZlY3RvcnMob2JqZWN0LnBvc2l0aW9uLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgY29uc3RyYWludC5hcHBsaWVkSW1wdWxzZSA9IGRhdGFbb2Zmc2V0ICsgNV07XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUpXG4gICAgICB0aGlzLnNlbmQoZGF0YS5idWZmZXIsIFtkYXRhLmJ1ZmZlcl0pOyAvLyBHaXZlIHRoZSB0eXBlZCBhcnJheSBiYWNrIHRvIHRoZSB3b3JrZXJcbiAgfVxuXG4gIHVwZGF0ZUNvbGxpc2lvbnMoaW5mbykge1xuICAgIC8qKlxuICAgICAqICNUT0RPXG4gICAgICogVGhpcyBpcyBwcm9iYWJseSB0aGUgd29yc3Qgd2F5IGV2ZXIgdG8gaGFuZGxlIGNvbGxpc2lvbnMuIFRoZSBpbmhlcmVudCBldmlsbmVzcyBpcyBhIHJlc2lkdWFsXG4gICAgICogZWZmZWN0IGZyb20gdGhlIHByZXZpb3VzIHZlcnNpb24ncyBldmlsbmVzcyB3aGljaCBtdXRhdGVkIHdoZW4gc3dpdGNoaW5nIHRvIHRyYW5zZmVyYWJsZSBvYmplY3RzLlxuICAgICAqXG4gICAgICogSWYgeW91IGZlZWwgaW5jbGluZWQgdG8gbWFrZSB0aGlzIGJldHRlciwgcGxlYXNlIGRvIHNvLlxuICAgICAqL1xuXG4gICAgY29uc3QgY29sbGlzaW9ucyA9IHt9LFxuICAgICAgbm9ybWFsX29mZnNldHMgPSB7fTtcblxuICAgIC8vIEJ1aWxkIGNvbGxpc2lvbiBtYW5pZmVzdFxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgaW5mb1sxXTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IGluZm9bb2Zmc2V0XTtcbiAgICAgIGNvbnN0IG9iamVjdDIgPSBpbmZvW29mZnNldCArIDFdO1xuXG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3R9LSR7b2JqZWN0Mn1gXSA9IG9mZnNldCArIDI7XG4gICAgICBub3JtYWxfb2Zmc2V0c1tgJHtvYmplY3QyfS0ke29iamVjdH1gXSA9IC0xICogKG9mZnNldCArIDIpO1xuXG4gICAgICAvLyBSZWdpc3RlciBjb2xsaXNpb25zIGZvciBib3RoIHRoZSBvYmplY3QgY29sbGlkaW5nIGFuZCB0aGUgb2JqZWN0IGJlaW5nIGNvbGxpZGVkIHdpdGhcbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3RdKSBjb2xsaXNpb25zW29iamVjdF0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0XS5wdXNoKG9iamVjdDIpO1xuXG4gICAgICBpZiAoIWNvbGxpc2lvbnNbb2JqZWN0Ml0pIGNvbGxpc2lvbnNbb2JqZWN0Ml0gPSBbXTtcbiAgICAgIGNvbGxpc2lvbnNbb2JqZWN0Ml0ucHVzaChvYmplY3QpO1xuICAgIH1cblxuICAgIC8vIERlYWwgd2l0aCBjb2xsaXNpb25zXG4gICAgZm9yIChjb25zdCBpZDEgaW4gdGhpcy5vYmplY3RzKSB7XG4gICAgICBpZiAoIXRoaXMub2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShpZDEpKSBjb250aW51ZTtcbiAgICAgIGNvbnN0IG9iamVjdCA9IHRoaXMub2JqZWN0c1tpZDFdO1xuICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIC8vIElmIG9iamVjdCB0b3VjaGVzIGFueXRoaW5nLCAuLi5cbiAgICAgIGlmIChjb2xsaXNpb25zW2lkMV0pIHtcbiAgICAgICAgLy8gQ2xlYW4gdXAgdG91Y2hlcyBhcnJheVxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGRhdGEudG91Y2hlcy5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGlmIChjb2xsaXNpb25zW2lkMV0uaW5kZXhPZihkYXRhLnRvdWNoZXNbal0pID09PSAtMSlcbiAgICAgICAgICAgIGRhdGEudG91Y2hlcy5zcGxpY2Uoai0tLCAxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEhhbmRsZSBlYWNoIGNvbGxpZGluZyBvYmplY3RcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBjb2xsaXNpb25zW2lkMV0ubGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICBjb25zdCBpZDIgPSBjb2xsaXNpb25zW2lkMV1bal07XG4gICAgICAgICAgY29uc3Qgb2JqZWN0MiA9IHRoaXMub2JqZWN0c1tpZDJdO1xuXG4gICAgICAgICAgaWYgKG9iamVjdDIpIHtcbiAgICAgICAgICAgIGNvbnN0IGNvbXBvbmVudDIgPSBvYmplY3QyLmNvbXBvbmVudDtcbiAgICAgICAgICAgIGNvbnN0IGRhdGEyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuICAgICAgICAgICAgLy8gSWYgb2JqZWN0IHdhcyBub3QgYWxyZWFkeSB0b3VjaGluZyBvYmplY3QyLCBub3RpZnkgb2JqZWN0XG4gICAgICAgICAgICBpZiAoZGF0YS50b3VjaGVzLmluZGV4T2YoaWQyKSA9PT0gLTEpIHtcbiAgICAgICAgICAgICAgZGF0YS50b3VjaGVzLnB1c2goaWQyKTtcblxuICAgICAgICAgICAgICBjb25zdCB2ZWwgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZ2V0TGluZWFyVmVsb2NpdHkoKTtcbiAgICAgICAgICAgICAgY29uc3QgdmVsMiA9IGNvbXBvbmVudDIudXNlKCdwaHlzaWNzJykuZ2V0TGluZWFyVmVsb2NpdHkoKTtcblxuICAgICAgICAgICAgICB0ZW1wMVZlY3RvcjMuc3ViVmVjdG9ycyh2ZWwsIHZlbDIpO1xuICAgICAgICAgICAgICBjb25zdCB0ZW1wMSA9IHRlbXAxVmVjdG9yMy5jbG9uZSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAyID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgbGV0IG5vcm1hbF9vZmZzZXQgPSBub3JtYWxfb2Zmc2V0c1tgJHtkYXRhLmlkfS0ke2RhdGEyLmlkfWBdO1xuXG4gICAgICAgICAgICAgIGlmIChub3JtYWxfb2Zmc2V0ID4gMCkge1xuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICAtaW5mb1tub3JtYWxfb2Zmc2V0XSxcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbm9ybWFsX29mZnNldCAqPSAtMTtcblxuICAgICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zZXQoXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgaW5mb1tub3JtYWxfb2Zmc2V0ICsgMV0sXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXQgKyAyXVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICBjb21wb25lbnQuZW1pdCgnY29sbGlzaW9uJywgb2JqZWN0MiwgdGVtcDEsIHRlbXAyLCB0ZW1wMVZlY3RvcjMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGRhdGEudG91Y2hlcy5sZW5ndGggPSAwOyAvLyBub3QgdG91Y2hpbmcgb3RoZXIgb2JqZWN0c1xuICAgIH1cblxuICAgIHRoaXMuY29sbGlzaW9ucyA9IGNvbGxpc2lvbnM7XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgYWRkQ29uc3RyYWludChjb25zdHJhaW50LCBzaG93X21hcmtlcikge1xuICAgIGNvbnN0cmFpbnQuaWQgPSB0aGlzLmdldE9iamVjdElkKCk7XG4gICAgdGhpcy5jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXSA9IGNvbnN0cmFpbnQ7XG4gICAgY29uc3RyYWludC53b3JsZE1vZHVsZSA9IHRoaXM7XG4gICAgdGhpcy5leGVjdXRlKCdhZGRDb25zdHJhaW50JywgY29uc3RyYWludC5nZXREZWZpbml0aW9uKCkpO1xuXG4gICAgaWYgKHNob3dfbWFya2VyKSB7XG4gICAgICBsZXQgbWFya2VyO1xuXG4gICAgICBzd2l0Y2ggKGNvbnN0cmFpbnQudHlwZSkge1xuICAgICAgICBjYXNlICdwb2ludCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnaGluZ2UnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ3NsaWRlcic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgQm94R2VvbWV0cnkoMTAsIDEsIDEpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcblxuICAgICAgICAgIC8vIFRoaXMgcm90YXRpb24gaXNuJ3QgcmlnaHQgaWYgYWxsIHRocmVlIGF4aXMgYXJlIG5vbi0wIHZhbHVlc1xuICAgICAgICAgIC8vIFRPRE86IGNoYW5nZSBtYXJrZXIncyByb3RhdGlvbiBvcmRlciB0byBaWVhcbiAgICAgICAgICBtYXJrZXIucm90YXRpb24uc2V0KFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnksIC8vIHllcywgeSBhbmRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy54LCAvLyB4IGF4aXMgYXJlIHN3YXBwZWRcbiAgICAgICAgICAgIGNvbnN0cmFpbnQuYXhpcy56XG4gICAgICAgICAgKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdjb25ldHdpc3QnOlxuICAgICAgICAgIG1hcmtlciA9IG5ldyBNZXNoKFxuICAgICAgICAgICAgbmV3IFNwaGVyZUdlb21ldHJ5KDEuNSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2RvZic6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGRlZmF1bHQ6XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGNvbnN0cmFpbnQ7XG4gIH1cblxuICBvblNpbXVsYXRpb25SZXN1bWUoKSB7XG4gICAgdGhpcy5leGVjdXRlKCdvblNpbXVsYXRpb25SZXN1bWUnLCB7fSk7XG4gIH1cblxuICByZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpIHtcbiAgICBpZiAodGhpcy5jb25zdHJhaW50c1tjb25zdHJhaW50LmlkXSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZUNvbnN0cmFpbnQnLCB7aWQ6IGNvbnN0cmFpbnQuaWR9KTtcbiAgICAgIGRlbGV0ZSB0aGlzLmNvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdO1xuICAgIH1cbiAgfVxuXG4gIGV4ZWN1dGUoY21kLCBwYXJhbXMpIHtcbiAgICB0aGlzLnNlbmQoe2NtZCwgcGFyYW1zfSk7XG4gIH1cblxuICBvbkFkZENhbGxiYWNrKGNvbXBvbmVudCkge1xuICAgIGNvbnN0IG9iamVjdCA9IGNvbXBvbmVudC5uYXRpdmU7XG4gICAgY29uc3QgZGF0YSA9IG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgIGlmIChkYXRhKSB7XG4gICAgICBjb21wb25lbnQubWFuYWdlci5zZXQoJ21vZHVsZTp3b3JsZCcsIHRoaXMpO1xuICAgICAgZGF0YS5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcbiAgICAgIG9iamVjdC5jb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YSA9IGRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICAgIHRoaXMub25BZGRDYWxsYmFjayhvYmplY3QubWVzaCk7XG4gICAgICAgIHRoaXMudmVoaWNsZXNbZGF0YS5pZF0gPSBvYmplY3Q7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnYWRkVmVoaWNsZScsIGRhdGEpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9IGZhbHNlO1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgIHRoaXMub2JqZWN0c1tkYXRhLmlkXSA9IG9iamVjdDtcblxuICAgICAgICBpZiAob2JqZWN0LmNoaWxkcmVuLmxlbmd0aCkge1xuICAgICAgICAgIGRhdGEuY2hpbGRyZW4gPSBbXTtcbiAgICAgICAgICBhZGRPYmplY3RDaGlsZHJlbihvYmplY3QsIG9iamVjdCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBvYmplY3QucXVhdGVybmlvbi5zZXRGcm9tRXVsZXIob2JqZWN0LnJvdGF0aW9uKTtcbiAgICAgICAgLy9cbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LmNvbXBvbmVudCk7XG4gICAgICAgIC8vIGNvbnNvbGUubG9nKG9iamVjdC5yb3RhdGlvbik7XG5cbiAgICAgICAgLy8gT2JqZWN0IHN0YXJ0aW5nIHBvc2l0aW9uICsgcm90YXRpb25cbiAgICAgICAgZGF0YS5wb3NpdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICB6OiBvYmplY3QucG9zaXRpb24uelxuICAgICAgICB9O1xuXG4gICAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgICAgeDogb2JqZWN0LnF1YXRlcm5pb24ueCxcbiAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgdzogb2JqZWN0LnF1YXRlcm5pb24ud1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChkYXRhLndpZHRoKSBkYXRhLndpZHRoICo9IG9iamVjdC5zY2FsZS54O1xuICAgICAgICBpZiAoZGF0YS5oZWlnaHQpIGRhdGEuaGVpZ2h0ICo9IG9iamVjdC5zY2FsZS55O1xuICAgICAgICBpZiAoZGF0YS5kZXB0aCkgZGF0YS5kZXB0aCAqPSBvYmplY3Quc2NhbGUuejtcblxuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2FkZE9iamVjdCcsIGRhdGEpO1xuICAgICAgfVxuXG4gICAgICBjb21wb25lbnQuZW1pdCgncGh5c2ljczphZGRlZCcpO1xuICAgIH1cbiAgfVxuXG4gIG9uUmVtb3ZlQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcblxuICAgIGlmIChvYmplY3QgaW5zdGFuY2VvZiBWZWhpY2xlKSB7XG4gICAgICB0aGlzLmV4ZWN1dGUoJ3JlbW92ZVZlaGljbGUnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgd2hpbGUgKG9iamVjdC53aGVlbHMubGVuZ3RoKSB0aGlzLnJlbW92ZShvYmplY3Qud2hlZWxzLnBvcCgpKTtcblxuICAgICAgdGhpcy5yZW1vdmUob2JqZWN0Lm1lc2gpO1xuICAgICAgdGhpcy52ZWhpY2xlc1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTWVzaC5wcm90b3R5cGUucmVtb3ZlLmNhbGwodGhpcywgb2JqZWN0KTtcblxuICAgICAgaWYgKG9iamVjdC5fcGh5c2lqcykge1xuICAgICAgICBjb21wb25lbnQubWFuYWdlci5yZW1vdmUoJ21vZHVsZTp3b3JsZCcpO1xuICAgICAgICB0aGlzLm9iamVjdHNbb2JqZWN0Ll9waHlzaWpzLmlkXSA9IG51bGw7XG4gICAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlT2JqZWN0Jywge2lkOiBvYmplY3QuX3BoeXNpanMuaWR9KTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBkZWZlcihmdW5jLCBhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBQcm9taXNlKChyZXNvbHZlKSA9PiB7XG4gICAgICBpZiAodGhpcy5pc0xvYWRlZCkge1xuICAgICAgICBmdW5jKC4uLmFyZ3MpO1xuICAgICAgICByZXNvbHZlKCk7XG4gICAgICB9IGVsc2UgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0pO1xuICAgIH0pO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcbiAgICBtYW5hZ2VyLnNldCgncGh5c2ljc1dvcmtlcicsIHRoaXMud29ya2VyKTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkFkZChjb21wb25lbnQsIHNlbGYpIHtcbiAgICAgIGlmIChjb21wb25lbnQudXNlKCdwaHlzaWNzJykpIHJldHVybiBzZWxmLmRlZmVyKHNlbGYub25BZGRDYWxsYmFjay5iaW5kKHNlbGYpLCBbY29tcG9uZW50XSk7XG4gICAgICByZXR1cm47XG4gICAgfSxcblxuICAgIG9uUmVtb3ZlKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vblJlbW92ZUNhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gIH07XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICAvLyAuLi5cblxuICAgIHRoaXMuc2V0Rml4ZWRUaW1lU3RlcCA9IGZ1bmN0aW9uKGZpeGVkVGltZVN0ZXApIHtcbiAgICAgIGlmIChmaXhlZFRpbWVTdGVwKSBzZWxmLmV4ZWN1dGUoJ3NldEZpeGVkVGltZVN0ZXAnLCBmaXhlZFRpbWVTdGVwKTtcbiAgICB9XG5cbiAgICB0aGlzLnNldEdyYXZpdHkgPSBmdW5jdGlvbihncmF2aXR5KSB7XG4gICAgICBpZiAoZ3Jhdml0eSkgc2VsZi5leGVjdXRlKCdzZXRHcmF2aXR5JywgZ3Jhdml0eSk7XG4gICAgfVxuXG4gICAgdGhpcy5hZGRDb25zdHJhaW50ID0gc2VsZi5hZGRDb25zdHJhaW50LmJpbmQoc2VsZik7XG5cbiAgICB0aGlzLnNpbXVsYXRlID0gZnVuY3Rpb24odGltZVN0ZXAsIG1heFN1YlN0ZXBzKSB7XG4gICAgICBpZiAoc2VsZi5fc3RhdHMpIHNlbGYuX3N0YXRzLmJlZ2luKCk7XG5cbiAgICAgIGlmIChzZWxmLmlzU2ltdWxhdGluZykgcmV0dXJuIGZhbHNlO1xuICAgICAgc2VsZi5pc1NpbXVsYXRpbmcgPSB0cnVlO1xuXG4gICAgICBmb3IgKGNvbnN0IG9iamVjdF9pZCBpbiBzZWxmLm9iamVjdHMpIHtcbiAgICAgICAgaWYgKCFzZWxmLm9iamVjdHMuaGFzT3duUHJvcGVydHkob2JqZWN0X2lkKSkgY29udGludWU7XG5cbiAgICAgICAgY29uc3Qgb2JqZWN0ID0gc2VsZi5vYmplY3RzW29iamVjdF9pZF07XG4gICAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBjb21wb25lbnQudXNlKCdwaHlzaWNzJykuZGF0YTtcblxuICAgICAgICBpZiAob2JqZWN0ICE9PSBudWxsICYmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uIHx8IGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24pKSB7XG4gICAgICAgICAgY29uc3QgdXBkYXRlID0ge2lkOiBkYXRhLmlkfTtcblxuICAgICAgICAgIGlmIChjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uKSB7XG4gICAgICAgICAgICB1cGRhdGUucG9zID0ge1xuICAgICAgICAgICAgICB4OiBvYmplY3QucG9zaXRpb24ueCxcbiAgICAgICAgICAgICAgeTogb2JqZWN0LnBvc2l0aW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZGF0YS5pc1NvZnRib2R5KSBvYmplY3QucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5xdWF0ID0ge1xuICAgICAgICAgICAgICB4OiBvYmplY3QucXVhdGVybmlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucXVhdGVybmlvbi55LFxuICAgICAgICAgICAgICB6OiBvYmplY3QucXVhdGVybmlvbi56LFxuICAgICAgICAgICAgICB3OiBvYmplY3QucXVhdGVybmlvbi53XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBpZiAoZGF0YS5pc1NvZnRib2R5KSBvYmplY3Qucm90YXRpb24uc2V0KDAsIDAsIDApO1xuXG4gICAgICAgICAgICBjb21wb25lbnQuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgc2VsZi5leGVjdXRlKCd1cGRhdGVUcmFuc2Zvcm0nLCB1cGRhdGUpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNlbGYuZXhlY3V0ZSgnc2ltdWxhdGUnLCB7dGltZVN0ZXAsIG1heFN1YlN0ZXBzfSk7XG5cbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuZW5kKCk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICAvLyBjb25zdCBzaW11bGF0ZVByb2Nlc3MgPSAodCkgPT4ge1xuICAgIC8vICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShzaW11bGF0ZVByb2Nlc3MpO1xuXG4gICAgLy8gICB0aGlzLnNpbXVsYXRlKDEvNjAsIDEpOyAvLyBkZWx0YSwgMVxuICAgIC8vIH1cblxuICAgIC8vIHNpbXVsYXRlUHJvY2VzcygpO1xuXG4gICAgc2VsZi5sb2FkZXIudGhlbigoKSA9PiB7XG4gICAgICBzZWxmLnNpbXVsYXRlTG9vcCA9IG5ldyBMb29wKChjbG9jaykgPT4ge1xuICAgICAgICB0aGlzLnNpbXVsYXRlKGNsb2NrLmdldERlbHRhKCksIDEpOyAvLyBkZWx0YSwgMVxuICAgICAgfSk7XG5cbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wLnN0YXJ0KHRoaXMpO1xuXG4gICAgICBjb25zb2xlLmxvZyhzZWxmLm9wdGlvbnMuZ3Jhdml0eSk7XG4gICAgICB0aGlzLnNldEdyYXZpdHkoc2VsZi5vcHRpb25zLmdyYXZpdHkpO1xuICAgIH0pO1xuICB9XG59XG4iLCJ2YXIgVEFSR0VUID0gdHlwZW9mIFN5bWJvbCA9PT0gJ3VuZGVmaW5lZCcgPyAnX190YXJnZXQnIDogU3ltYm9sKCksXG4gICAgU0NSSVBUX1RZUEUgPSAnYXBwbGljYXRpb24vamF2YXNjcmlwdCcsXG4gICAgQmxvYkJ1aWxkZXIgPSB3aW5kb3cuQmxvYkJ1aWxkZXIgfHwgd2luZG93LldlYktpdEJsb2JCdWlsZGVyIHx8IHdpbmRvdy5Nb3pCbG9iQnVpbGRlciB8fCB3aW5kb3cuTVNCbG9iQnVpbGRlcixcbiAgICBVUkwgPSB3aW5kb3cuVVJMIHx8IHdpbmRvdy53ZWJraXRVUkwsXG4gICAgV29ya2VyID0gd2luZG93LldvcmtlcjtcblxuLyoqXG4gKiBSZXR1cm5zIGEgd3JhcHBlciBhcm91bmQgV2ViIFdvcmtlciBjb2RlIHRoYXQgaXMgY29uc3RydWN0aWJsZS5cbiAqXG4gKiBAZnVuY3Rpb24gc2hpbVdvcmtlclxuICpcbiAqIEBwYXJhbSB7IFN0cmluZyB9ICAgIGZpbGVuYW1lICAgIFRoZSBuYW1lIG9mIHRoZSBmaWxlXG4gKiBAcGFyYW0geyBGdW5jdGlvbiB9ICBmbiAgICAgICAgICBGdW5jdGlvbiB3cmFwcGluZyB0aGUgY29kZSBvZiB0aGUgd29ya2VyXG4gKi9cbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIHNoaW1Xb3JrZXIgKGZpbGVuYW1lLCBmbikge1xuICAgIHJldHVybiBmdW5jdGlvbiBTaGltV29ya2VyIChmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgIHZhciBvID0gdGhpcztcblxuICAgICAgICBpZiAoIWZuKSB7XG4gICAgICAgICAgICByZXR1cm4gbmV3IFdvcmtlcihmaWxlbmFtZSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoV29ya2VyICYmICFmb3JjZUZhbGxiYWNrKSB7XG4gICAgICAgICAgICAvLyBDb252ZXJ0IHRoZSBmdW5jdGlvbidzIGlubmVyIGNvZGUgdG8gYSBzdHJpbmcgdG8gY29uc3RydWN0IHRoZSB3b3JrZXJcbiAgICAgICAgICAgIHZhciBzb3VyY2UgPSBmbi50b1N0cmluZygpLnJlcGxhY2UoL15mdW5jdGlvbi4rP3svLCAnJykuc2xpY2UoMCwgLTEpLFxuICAgICAgICAgICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdChzb3VyY2UpO1xuXG4gICAgICAgICAgICB0aGlzW1RBUkdFVF0gPSBuZXcgV29ya2VyKG9ialVSTCk7XG4gICAgICAgICAgICBVUkwucmV2b2tlT2JqZWN0VVJMKG9ialVSTCk7XG4gICAgICAgICAgICByZXR1cm4gdGhpc1tUQVJHRVRdO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdmFyIHNlbGZTaGltID0ge1xuICAgICAgICAgICAgICAgICAgICBwb3N0TWVzc2FnZTogZnVuY3Rpb24obSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG8ub25tZXNzYWdlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBvLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogc2VsZlNoaW0gfSkgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBmbi5jYWxsKHNlbGZTaGltKTtcbiAgICAgICAgICAgIHRoaXMucG9zdE1lc3NhZ2UgPSBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpeyBzZWxmU2hpbS5vbm1lc3NhZ2UoeyBkYXRhOiBtLCB0YXJnZXQ6IG8gfSkgfSk7XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgdGhpcy5pc1RoaXNUaHJlYWQgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcbn07XG5cbi8vIFRlc3QgV29ya2VyIGNhcGFiaWxpdGllc1xuaWYgKFdvcmtlcikge1xuICAgIHZhciB0ZXN0V29ya2VyLFxuICAgICAgICBvYmpVUkwgPSBjcmVhdGVTb3VyY2VPYmplY3QoJ3NlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKCkge30nKSxcbiAgICAgICAgdGVzdEFycmF5ID0gbmV3IFVpbnQ4QXJyYXkoMSk7XG5cbiAgICB0cnkge1xuICAgICAgICAvLyBObyB3b3JrZXJzIHZpYSBibG9icyBpbiBFZGdlIDEyIGFuZCBJRSAxMSBhbmQgbG93ZXIgOihcbiAgICAgICAgaWYgKC8oPzpUcmlkZW50fEVkZ2UpXFwvKD86WzU2N118MTIpL2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdOb3QgYXZhaWxhYmxlJyk7XG4gICAgICAgIH1cbiAgICAgICAgdGVzdFdvcmtlciA9IG5ldyBXb3JrZXIob2JqVVJMKTtcblxuICAgICAgICAvLyBOYXRpdmUgYnJvd3NlciBvbiBzb21lIFNhbXN1bmcgZGV2aWNlcyB0aHJvd3MgZm9yIHRyYW5zZmVyYWJsZXMsIGxldCdzIGRldGVjdCBpdFxuICAgICAgICB0ZXN0V29ya2VyLnBvc3RNZXNzYWdlKHRlc3RBcnJheSwgW3Rlc3RBcnJheS5idWZmZXJdKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgV29ya2VyID0gbnVsbDtcbiAgICB9XG4gICAgZmluYWxseSB7XG4gICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgaWYgKHRlc3RXb3JrZXIpIHtcbiAgICAgICAgICAgIHRlc3RXb3JrZXIudGVybWluYXRlKCk7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZVNvdXJjZU9iamVjdChzdHIpIHtcbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gVVJMLmNyZWF0ZU9iamVjdFVSTChuZXcgQmxvYihbc3RyXSwgeyB0eXBlOiBTQ1JJUFRfVFlQRSB9KSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHZhciBibG9iID0gbmV3IEJsb2JCdWlsZGVyKCk7XG4gICAgICAgIGJsb2IuYXBwZW5kKHN0cik7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IuZ2V0QmxvYih0eXBlKSk7XG4gICAgfVxufVxuIiwiaW1wb3J0IHNoaW1Xb3JrZXIgZnJvbSAncm9sbHVwLXBsdWdpbi1idW5kbGUtd29ya2VyJztcbmV4cG9ydCBkZWZhdWx0IG5ldyBzaGltV29ya2VyKFwiLi4vd29ya2VyLmpzXCIsIGZ1bmN0aW9uICh3aW5kb3csIGRvY3VtZW50KSB7XG52YXIgc2VsZiA9IHRoaXM7XG5mdW5jdGlvbiBFdmVudHModGFyZ2V0KSB7XG4gIHZhciBldmVudHMgPSB7fSxcbiAgICBlbXB0eSA9IFtdO1xuICB0YXJnZXQgPSB0YXJnZXQgfHwgdGhpc1xuICAvKipcbiAgICogIE9uOiBsaXN0ZW4gdG8gZXZlbnRzXG4gICAqL1xuICB0YXJnZXQub24gPSBmdW5jdGlvbiAodHlwZSwgZnVuYywgY3R4KSB7XG4gICAgKGV2ZW50c1t0eXBlXSA9IGV2ZW50c1t0eXBlXSB8fCBbXSkucHVzaChbZnVuYywgY3R4XSlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH1cbiAgLyoqXG4gICAqICBPZmY6IHN0b3AgbGlzdGVuaW5nIHRvIGV2ZW50IC8gc3BlY2lmaWMgY2FsbGJhY2tcbiAgICovXG4gIHRhcmdldC5vZmYgPSBmdW5jdGlvbiAodHlwZSwgZnVuYykge1xuICAgIHR5cGUgfHwgKGV2ZW50cyA9IHt9KVxuICAgIHZhciBsaXN0ID0gZXZlbnRzW3R5cGVdIHx8IGVtcHR5LFxuICAgICAgaSA9IGxpc3QubGVuZ3RoID0gZnVuYyA/IGxpc3QubGVuZ3RoIDogMDtcbiAgICB3aGlsZSAoaS0tKSBmdW5jID09IGxpc3RbaV1bMF0gJiYgbGlzdC5zcGxpY2UoaSwgMSlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH1cbiAgLyoqXG4gICAqIEVtaXQ6IHNlbmQgZXZlbnQsIGNhbGxiYWNrcyB3aWxsIGJlIHRyaWdnZXJlZFxuICAgKi9cbiAgdGFyZ2V0LmVtaXQgPSBmdW5jdGlvbiAodHlwZSkge1xuICAgIHZhciBlID0gZXZlbnRzW3R5cGVdIHx8IGVtcHR5LFxuICAgICAgbGlzdCA9IGUubGVuZ3RoID4gMCA/IGUuc2xpY2UoMCwgZS5sZW5ndGgpIDogZSxcbiAgICAgIGkgPSAwLFxuICAgICAgajtcbiAgICB3aGlsZSAoaiA9IGxpc3RbaSsrXSkgalswXS5hcHBseShqWzFdLCBlbXB0eS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSkpXG4gICAgcmV0dXJuIHRhcmdldFxuICB9O1xufTtcblxuY29uc3QgaW5zaWRlV29ya2VyID0gIXNlbGYuZG9jdW1lbnQ7XG5pZiAoIWluc2lkZVdvcmtlcikgc2VsZiA9IG5ldyBFdmVudHMoKTtcblxubGV0IHNlbmQgPSBpbnNpZGVXb3JrZXIgPyAoc2VsZi53ZWJraXRQb3N0TWVzc2FnZSB8fCBzZWxmLnBvc3RNZXNzYWdlKSA6IGZ1bmN0aW9uIChkYXRhKSB7XG4gIHNlbGYuZW1pdCgnbWVzc2FnZScsIHsgZGF0YSB9KTtcbn07XG5cbnNlbGYuc2VuZCA9IHNlbmQ7XG5cbmxldCBTVVBQT1JUX1RSQU5TRkVSQUJMRTtcblxuaWYgKGluc2lkZVdvcmtlcikge1xuICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcblxuICBzZW5kKGFiLCBbYWJdKTtcbiAgU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG59XG5cbmNvbnN0IE1FU1NBR0VfVFlQRVMgPSB7XG4gIFdPUkxEUkVQT1JUOiAwLFxuICBDT0xMSVNJT05SRVBPUlQ6IDEsXG4gIFZFSElDTEVSRVBPUlQ6IDIsXG4gIENPTlNUUkFJTlRSRVBPUlQ6IDMsXG4gIFNPRlRSRVBPUlQ6IDRcbn07XG5cbi8vIHRlbXAgdmFyaWFibGVzXG5sZXQgX29iamVjdCxcbiAgX3ZlY3RvcixcbiAgX3RyYW5zZm9ybSxcbiAgX3RyYW5zZm9ybV9wb3MsXG4gIF9zb2Z0Ym9keV9lbmFibGVkID0gZmFsc2UsXG4gIGxhc3Rfc2ltdWxhdGlvbl9kdXJhdGlvbiA9IDAsXG5cbiAgX251bV9vYmplY3RzID0gMCxcbiAgX251bV9yaWdpZGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fc29mdGJvZHlfb2JqZWN0cyA9IDAsXG4gIF9udW1fd2hlZWxzID0gMCxcbiAgX251bV9jb25zdHJhaW50cyA9IDAsXG4gIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSA9IDAsXG5cbiAgLy8gd29ybGQgdmFyaWFibGVzXG4gIGZpeGVkVGltZVN0ZXAsIC8vIHVzZWQgd2hlbiBjYWxsaW5nIHN0ZXBTaW11bGF0aW9uXG4gIGxhc3Rfc2ltdWxhdGlvbl90aW1lLFxuXG4gIHdvcmxkLFxuICBfdmVjM18xLFxuICBfdmVjM18yLFxuICBfdmVjM18zLFxuICBfcXVhdDtcblxuLy8gcHJpdmF0ZSBjYWNoZVxuY29uc3QgcHVibGljX2Z1bmN0aW9ucyA9IHt9LFxuICBfb2JqZWN0cyA9IFtdLFxuICBfdmVoaWNsZXMgPSBbXSxcbiAgX2NvbnN0cmFpbnRzID0gW10sXG4gIF9vYmplY3RzX2FtbW8gPSB7fSxcbiAgX29iamVjdF9zaGFwZXMgPSB7fSxcblxuICAvLyBUaGUgZm9sbG93aW5nIG9iamVjdHMgYXJlIHRvIHRyYWNrIG9iamVjdHMgdGhhdCBhbW1vLmpzIGRvZXNuJ3QgY2xlYW5cbiAgLy8gdXAuIEFsbCBhcmUgY2xlYW5lZCB1cCB3aGVuIHRoZXkncmUgY29ycmVzcG9uZGluZyBib2R5IGlzIGRlc3Ryb3llZC5cbiAgLy8gVW5mb3J0dW5hdGVseSwgaXQncyB2ZXJ5IGRpZmZpY3VsdCB0byBnZXQgYXQgdGhlc2Ugb2JqZWN0cyBmcm9tIHRoZVxuICAvLyBib2R5LCBzbyB3ZSBoYXZlIHRvIHRyYWNrIHRoZW0gb3Vyc2VsdmVzLlxuICBfbW90aW9uX3N0YXRlcyA9IHt9LFxuICAvLyBEb24ndCBuZWVkIHRvIHdvcnJ5IGFib3V0IGl0IGZvciBjYWNoZWQgc2hhcGVzLlxuICBfbm9uY2FjaGVkX3NoYXBlcyA9IHt9LFxuICAvLyBBIGJvZHkgd2l0aCBhIGNvbXBvdW5kIHNoYXBlIGFsd2F5cyBoYXMgYSByZWd1bGFyIHNoYXBlIGFzIHdlbGwsIHNvIHdlXG4gIC8vIGhhdmUgdHJhY2sgdGhlbSBzZXBhcmF0ZWx5LlxuICBfY29tcG91bmRfc2hhcGVzID0ge307XG5cbi8vIG9iamVjdCByZXBvcnRpbmdcbmxldCBSRVBPUlRfQ0hVTktTSVpFLCAvLyByZXBvcnQgYXJyYXkgaXMgaW5jcmVhc2VkIGluIGluY3JlbWVudHMgb2YgdGhpcyBjaHVuayBzaXplXG4gIHdvcmxkcmVwb3J0LFxuICBzb2Z0cmVwb3J0LFxuICBjb2xsaXNpb25yZXBvcnQsXG4gIHZlaGljbGVyZXBvcnQsXG4gIGNvbnN0cmFpbnRyZXBvcnQ7XG5cbmNvbnN0IFdPUkxEUkVQT1JUX0lURU1TSVpFID0gMTQsIC8vIGhvdyBtYW55IGZsb2F0IHZhbHVlcyBlYWNoIHJlcG9ydGVkIGl0ZW0gbmVlZHNcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFID0gNSwgLy8gb25lIGZsb2F0IGZvciBlYWNoIG9iamVjdCBpZCwgYW5kIGEgVmVjMyBjb250YWN0IG5vcm1hbFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFID0gOSwgLy8gdmVoaWNsZSBpZCwgd2hlZWwgaW5kZXgsIDMgZm9yIHBvc2l0aW9uLCA0IGZvciByb3RhdGlvblxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjsgLy8gY29uc3RyYWludCBpZCwgb2Zmc2V0IG9iamVjdCwgb2Zmc2V0LCBhcHBsaWVkIGltcHVsc2VcblxuY29uc3QgZ2V0U2hhcGVGcm9tQ2FjaGUgPSAoY2FjaGVfa2V5KSA9PiB7XG4gIGlmIChfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldICE9PSB1bmRlZmluZWQpXG4gICAgcmV0dXJuIF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV07XG5cbiAgcmV0dXJuIG51bGw7XG59O1xuXG5jb25zdCBzZXRTaGFwZUNhY2hlID0gKGNhY2hlX2tleSwgc2hhcGUpID0+IHtcbiAgX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XSA9IHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU2hhcGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IHNoYXBlO1xuXG4gIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcbiAgc3dpdGNoIChkZXNjcmlwdGlvbi50eXBlKSB7XG4gIGNhc2UgJ2NvbXBvdW5kJzpcbiAgICB7XG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3BsYW5lJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgcGxhbmVfJHtkZXNjcmlwdGlvbi5ub3JtYWwueH1fJHtkZXNjcmlwdGlvbi5ub3JtYWwueX1fJHtkZXNjcmlwdGlvbi5ub3JtYWwuen1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLm5vcm1hbC54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLm5vcm1hbC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLm5vcm1hbC56KTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFN0YXRpY1BsYW5lU2hhcGUoX3ZlYzNfMSwgMCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnYm94JzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgYm94XyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJveFNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3NwaGVyZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYHNwaGVyZV8ke2Rlc2NyaXB0aW9uLnJhZGl1c31gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idFNwaGVyZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY3lsaW5kZXInOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjeWxpbmRlcl8ke2Rlc2NyaXB0aW9uLndpZHRofV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1fJHtkZXNjcmlwdGlvbi5kZXB0aH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLndpZHRoIC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5oZWlnaHQgLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmRlcHRoIC8gMik7XG4gICAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDeWxpbmRlclNoYXBlKF92ZWMzXzEpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NhcHN1bGUnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjYXBzdWxlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgLy8gSW4gQnVsbGV0LCBjYXBzdWxlIGhlaWdodCBleGNsdWRlcyB0aGUgZW5kIHNwaGVyZXNcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENhcHN1bGVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCAtIDIgKiBkZXNjcmlwdGlvbi5yYWRpdXMpO1xuICAgICAgICBzZXRTaGFwZUNhY2hlKGNhY2hlX2tleSwgc2hhcGUpO1xuICAgICAgfVxuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NvbmUnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBjb25lXyR7ZGVzY3JpcHRpb24ucmFkaXVzfV8ke2Rlc2NyaXB0aW9uLmhlaWdodH1gO1xuXG4gICAgICBpZiAoKHNoYXBlID0gZ2V0U2hhcGVGcm9tQ2FjaGUoY2FjaGVfa2V5KSkgPT09IG51bGwpIHtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbmVTaGFwZShkZXNjcmlwdGlvbi5yYWRpdXMsIGRlc2NyaXB0aW9uLmhlaWdodCk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29uY2F2ZSc6XG4gICAge1xuICAgICAgY29uc3QgdHJpYW5nbGVfbWVzaCA9IG5ldyBBbW1vLmJ0VHJpYW5nbGVNZXNoKCk7XG4gICAgICBpZiAoIWRlc2NyaXB0aW9uLmRhdGEubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG4gICAgICBjb25zdCBkYXRhID0gZGVzY3JpcHRpb24uZGF0YTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhLmxlbmd0aCAvIDk7IGkrKykge1xuICAgICAgICBfdmVjM18xLnNldFgoZGF0YVtpICogOV0pO1xuICAgICAgICBfdmVjM18xLnNldFkoZGF0YVtpICogOSArIDFdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRhdGFbaSAqIDkgKyAyXSk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRhdGFbaSAqIDkgKyAzXSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkYXRhW2kgKiA5ICsgNF0pO1xuICAgICAgICBfdmVjM18yLnNldFooZGF0YVtpICogOSArIDVdKTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGF0YVtpICogOSArIDZdKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRhdGFbaSAqIDkgKyA3XSk7XG4gICAgICAgIF92ZWMzXzMuc2V0WihkYXRhW2kgKiA5ICsgOF0pO1xuXG4gICAgICAgIHRyaWFuZ2xlX21lc2guYWRkVHJpYW5nbGUoXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgZmFsc2VcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEJ2aFRyaWFuZ2xlTWVzaFNoYXBlKFxuICAgICAgICB0cmlhbmdsZV9tZXNoLFxuICAgICAgICB0cnVlLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjb252ZXgnOlxuICAgIHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb252ZXhIdWxsU2hhcGUoKTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gMzsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiAzXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiAzICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogMyArIDJdKTtcblxuICAgICAgICBzaGFwZS5hZGRQb2ludChfdmVjM18xKTtcbiAgICAgIH1cblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnaGVpZ2h0ZmllbGQnOlxuICAgIHtcbiAgICAgIGNvbnN0IHhwdHMgPSBkZXNjcmlwdGlvbi54cHRzLFxuICAgICAgICB5cHRzID0gZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcG9pbnRzID0gZGVzY3JpcHRpb24ucG9pbnRzLFxuICAgICAgICBwdHIgPSBBbW1vLl9tYWxsb2MoNCAqIHhwdHMgKiB5cHRzKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDAsIHAgPSAwLCBwMiA9IDA7IGkgPCB4cHRzOyBpKyspIHtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCB5cHRzOyBqKyspIHtcbiAgICAgICAgICBBbW1vLkhFQVBGMzJbcHRyICsgcDIgPj4gMl0gPSBwb2ludHNbcF07XG5cbiAgICAgICAgICBwKys7XG4gICAgICAgICAgcDIgKz0gNDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUoXG4gICAgICAgIGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIGRlc2NyaXB0aW9uLnlwdHMsXG4gICAgICAgIHB0cixcbiAgICAgICAgMSwgLWRlc2NyaXB0aW9uLmFic01heEhlaWdodCxcbiAgICAgICAgZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICAxLFxuICAgICAgICAnUEhZX0ZMT0FUJyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuICAgICAgYnJlYWs7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIHNoYXBlO1xufTtcblxuY29uc3QgY3JlYXRlU29mdEJvZHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgbGV0IGJvZHk7XG5cbiAgY29uc3Qgc29mdEJvZHlIZWxwZXJzID0gbmV3IEFtbW8uYnRTb2Z0Qm9keUhlbHBlcnMoKTtcblxuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgY2FzZSAnc29mdFRyaW1lc2gnOlxuICAgIHtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uYVZlcnRpY2VzLmxlbmd0aCkgcmV0dXJuIGZhbHNlO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZUZyb21UcmlNZXNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgZGVzY3JpcHRpb24uYVZlcnRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcyxcbiAgICAgICAgZGVzY3JpcHRpb24uYUluZGljZXMubGVuZ3RoIC8gMyxcbiAgICAgICAgZmFsc2VcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnc29mdENsb3RoTWVzaCc6XG4gICAge1xuICAgICAgY29uc3QgY3IgPSBkZXNjcmlwdGlvbi5jb3JuZXJzO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVBhdGNoKFxuICAgICAgICB3b3JsZC5nZXRXb3JsZEluZm8oKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzBdLCBjclsxXSwgY3JbMl0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbM10sIGNyWzRdLCBjcls1XSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjcls2XSwgY3JbN10sIGNyWzhdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzldLCBjclsxMF0sIGNyWzExXSksXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzBdLFxuICAgICAgICBkZXNjcmlwdGlvbi5zZWdtZW50c1sxXSxcbiAgICAgICAgMCxcbiAgICAgICAgdHJ1ZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzb2Z0Um9wZU1lc2gnOlxuICAgIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBib2R5ID0gc29mdEJvZHlIZWxwZXJzLkNyZWF0ZVJvcGUoXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoZGF0YVswXSwgZGF0YVsxXSwgZGF0YVsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzNdLCBkYXRhWzRdLCBkYXRhWzVdKSxcbiAgICAgICAgZGF0YVs2XSAtIDEsXG4gICAgICAgIDBcbiAgICAgICk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgZGVmYXVsdDpcbiAgICAvLyBOb3QgcmVjb2duaXplZFxuICAgIHJldHVybjtcbiAgfVxuXG4gIHJldHVybiBib2R5O1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5pbml0ID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmIChwYXJhbXMubm9Xb3JrZXIpIHtcbiAgICB3aW5kb3cuQW1tbyA9IG5ldyBwYXJhbXMuYW1tbygpO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHBhcmFtcy53YXNtQnVmZmVyKSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG5cbiAgICBzZWxmLkFtbW8gPSBuZXcgbG9hZEFtbW9Gcm9tQmluYXJ5KHBhcmFtcy53YXNtQnVmZmVyKSgpO1xuICAgIHNlbmQoeyBjbWQ6ICdhbW1vTG9hZGVkJyB9KTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG4gIGVsc2Uge1xuICAgIGltcG9ydFNjcmlwdHMocGFyYW1zLmFtbW8pO1xuICAgIHNlbmQoeyBjbWQ6ICdhbW1vTG9hZGVkJyB9KTtcblxuICAgIHNlbGYuQW1tbyA9IG5ldyBBbW1vKCk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgfVxufVxuXG5wdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZCA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBfdHJhbnNmb3JtID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgX3RyYW5zZm9ybV9wb3MgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdmVjM18xID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18yID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfdmVjM18zID0gbmV3IEFtbW8uYnRWZWN0b3IzKDAsIDAsIDApO1xuICBfcXVhdCA9IG5ldyBBbW1vLmJ0UXVhdGVybmlvbigwLCAwLCAwLCAwKTtcblxuICBSRVBPUlRfQ0hVTktTSVpFID0gcGFyYW1zLnJlcG9ydHNpemUgfHwgNTA7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBzdXBwb3J0ZWQsIHRha2UgYWR2YW50YWdlIG9mIHRoZW0gd2l0aCBUeXBlZEFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb2xsaXNpb25zIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMiArIFJFUE9SVF9DSFVOS1NJWkUgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCArICMgb2YgdmVoaWNsZXMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBjb25zdHJhaW50cyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICB9XG4gIGVsc2Uge1xuICAgIC8vIFRyYW5zZmVyYWJsZSBtZXNzYWdlcyBhcmUgbm90IHN1cHBvcnRlZCwgc2VuZCBkYXRhIGFzIG5vcm1hbCBhcnJheXNcbiAgICB3b3JsZHJlcG9ydCA9IFtdO1xuICAgIGNvbGxpc2lvbnJlcG9ydCA9IFtdO1xuICAgIHZlaGljbGVyZXBvcnQgPSBbXTtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gW107XG4gIH1cblxuICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuXG4gIGNvbnN0IGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24gPSBwYXJhbXMuc29mdGJvZHkgP1xuICAgIG5ldyBBbW1vLmJ0U29mdEJvZHlSaWdpZEJvZHlDb2xsaXNpb25Db25maWd1cmF0aW9uKCkgOlxuICAgIG5ldyBBbW1vLmJ0RGVmYXVsdENvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKSxcbiAgICBkaXNwYXRjaGVyID0gbmV3IEFtbW8uYnRDb2xsaXNpb25EaXNwYXRjaGVyKGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pLFxuICAgIHNvbHZlciA9IG5ldyBBbW1vLmJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyKCk7XG5cbiAgbGV0IGJyb2FkcGhhc2U7XG5cbiAgaWYgKCFwYXJhbXMuYnJvYWRwaGFzZSkgcGFyYW1zLmJyb2FkcGhhc2UgPSB7IHR5cGU6ICdkeW5hbWljJyB9O1xuICAvLyBUT0RPISEhXG4gIC8qIGlmIChwYXJhbXMuYnJvYWRwaGFzZS50eXBlID09PSAnc3dlZXBwcnVuZScpIHtcbiAgICBleHRlbmQocGFyYW1zLmJyb2FkcGhhc2UsIHtcbiAgICAgIGFhYmJtaW46IHtcbiAgICAgICAgeDogLTUwLFxuICAgICAgICB5OiAtNTAsXG4gICAgICAgIHo6IC01MFxuICAgICAgfSxcblxuICAgICAgYWFiYm1heDoge1xuICAgICAgICB4OiA1MCxcbiAgICAgICAgeTogNTAsXG4gICAgICAgIHo6IDUwXG4gICAgICB9LFxuICAgIH0pO1xuICB9Ki9cblxuICBzd2l0Y2ggKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUpIHtcbiAgY2FzZSAnc3dlZXBwcnVuZSc6XG4gICAgX3ZlYzNfMS5zZXRYKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueCk7XG4gICAgX3ZlYzNfMS5zZXRZKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKHBhcmFtcy5icm9hZHBoYXNlLmFhYmJtaW4ueik7XG5cbiAgICBfdmVjM18yLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC54KTtcbiAgICBfdmVjM18yLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC55KTtcbiAgICBfdmVjM18yLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1heC56KTtcblxuICAgIGJyb2FkcGhhc2UgPSBuZXcgQW1tby5idEF4aXNTd2VlcDMoXG4gICAgICBfdmVjM18xLFxuICAgICAgX3ZlYzNfMlxuICAgICk7XG5cbiAgICBicmVhaztcbiAgY2FzZSAnZHluYW1pYyc6XG4gIGRlZmF1bHQ6XG4gICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0RGJ2dEJyb2FkcGhhc2UoKTtcbiAgICBicmVhaztcbiAgfVxuXG4gIHdvcmxkID0gcGFyYW1zLnNvZnRib2R5ID9cbiAgICBuZXcgQW1tby5idFNvZnRSaWdpZER5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uLCBuZXcgQW1tby5idERlZmF1bHRTb2Z0Qm9keVNvbHZlcigpKSA6XG4gICAgbmV3IEFtbW8uYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQoZGlzcGF0Y2hlciwgYnJvYWRwaGFzZSwgc29sdmVyLCBjb2xsaXNpb25Db25maWd1cmF0aW9uKTtcbiAgZml4ZWRUaW1lU3RlcCA9IHBhcmFtcy5maXhlZFRpbWVTdGVwO1xuXG4gIGlmIChwYXJhbXMuc29mdGJvZHkpIF9zb2Z0Ym9keV9lbmFibGVkID0gdHJ1ZTtcblxuICBzZW5kKHsgY21kOiAnd29ybGRSZWFkeScgfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEZpeGVkVGltZVN0ZXAgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgZml4ZWRUaW1lU3RlcCA9IGRlc2NyaXB0aW9uO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRHcmF2aXR5ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi54KTtcbiAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnkpO1xuICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ueik7XG4gIHdvcmxkLnNldEdyYXZpdHkoX3ZlYzNfMSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZEFuY2hvciA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmpdXG4gICAgLmFwcGVuZEFuY2hvcihcbiAgICAgIGRlc2NyaXB0aW9uLm5vZGUsXG4gICAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5vYmoyXSxcbiAgICAgIGRlc2NyaXB0aW9uLmNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMsXG4gICAgICBkZXNjcmlwdGlvbi5pbmZsdWVuY2VcbiAgICApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmxpbmtOb2RlcyA9IChkZXNjcmlwdGlvbikgPT4ge1xuICB2YXIgc2VsZl9ib2R5ID0gX29iamVjdHNbZGVzY3JpcHRpb24uc2VsZl07XG4gIHZhciBvdGhlcl9ib2R5ID0gX29iamVjdHNbZGVzY3JpcHRpb24uYm9keV07XG5cbiAgdmFyIHNlbGZfbm9kZSA9IHNlbGZfYm9keS5nZXRfbV9ub2RlcygpLmF0KGRlc2NyaXB0aW9uLm4xKTtcbiAgdmFyIG90aGVyX25vZGUgPSBvdGhlcl9ib2R5LmdldF9tX25vZGVzKCkuYXQoZGVzY3JpcHRpb24ubjIpO1xuXG4gIHZhciBzZWxmX3ZlYyA9IHNlbGZfbm9kZS5nZXRfbV94KCk7XG4gIHZhciBvdGhlcl92ZWMgPSBvdGhlcl9ub2RlLmdldF9tX3goKTtcblxuICB2YXIgZm9yY2VfeCA9IG90aGVyX3ZlYy54KCkgLSBzZWxmX3ZlYy54KCk7XG4gIHZhciBmb3JjZV95ID0gb3RoZXJfdmVjLnkoKSAtIHNlbGZfdmVjLnkoKTtcbiAgdmFyIGZvcmNlX3ogPSBvdGhlcl92ZWMueigpIC0gc2VsZl92ZWMueigpO1xuXG5cbiAgLy8gdmFyIG1vZGlmaWVyID0gMzA7XG5cbiAgbGV0IGNhY2hlZF9kaXN0YW5jZSwgbGlua2VkID0gZmFsc2U7XG5cbiAgY29uc3QgX2xvb3AgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gICAgZm9yY2VfeCA9IG90aGVyX3ZlYy54KCkgLSBzZWxmX3ZlYy54KCk7XG4gICAgZm9yY2VfeSA9IG90aGVyX3ZlYy55KCkgLSBzZWxmX3ZlYy55KCk7XG4gICAgZm9yY2VfeiA9IG90aGVyX3ZlYy56KCkgLSBzZWxmX3ZlYy56KCk7XG5cbiAgICBsZXQgZGlzdGFuY2UgPSBNYXRoLnNxcnQoZm9yY2VfeCAqIGZvcmNlX3ggKyBmb3JjZV95ICogZm9yY2VfeSArIGZvcmNlX3ogKiBmb3JjZV96KTtcblxuICAgIGlmIChjYWNoZWRfZGlzdGFuY2UgJiYgIWxpbmtlZCAmJiBjYWNoZWRfZGlzdGFuY2UgPCBkaXN0YW5jZSkgeyAvLyBjYWNoZWRfZGlzdGFuY2UgJiYgIWxpbmtlZCAmJiBjYWNoZWRfZGlzdGFuY2UgPCBkaXN0YW5jZVxuXG4gICAgICBsaW5rZWQgPSB0cnVlO1xuXG4gICAgICAvLyBsZXQgc2VsZl92ZWwgPSBzZWxmX25vZGUuZ2V0X21fdigpO1xuICAgICAgLy9cbiAgICAgIC8vIF92ZWMzXzEuc2V0WCgtc2VsZl92ZWwueCgpKTtcbiAgICAgIC8vIF92ZWMzXzEuc2V0WSgtc2VsZl92ZWwueSgpKTtcbiAgICAgIC8vIF92ZWMzXzEuc2V0Wigtc2VsZl92ZWwueigpKTtcbiAgICAgIC8vXG4gICAgICAvLyBsZXQgb3RoZXJfdmVsID0gb3RoZXJfbm9kZS5nZXRfbV92KCk7XG4gICAgICAvL1xuICAgICAgLy8gX3ZlYzNfMi5zZXRYKC1vdGhlcl92ZWwueCgpKTtcbiAgICAgIC8vIF92ZWMzXzIuc2V0WSgtb3RoZXJfdmVsLnkoKSk7XG4gICAgICAvLyBfdmVjM18yLnNldFooLW90aGVyX3ZlbC56KCkpO1xuXG4gICAgICBjb25zb2xlLmxvZygnbGluayEnKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKDApO1xuICAgICAgX3ZlYzNfMS5zZXRZKDApO1xuICAgICAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gICAgICBzZWxmX2JvZHkuc2V0VmVsb2NpdHkoXG4gICAgICAgIF92ZWMzXzFcbiAgICAgICk7XG5cbiAgICAgIG90aGVyX2JvZHkuc2V0VmVsb2NpdHkoXG4gICAgICAgIF92ZWMzXzFcbiAgICAgICk7XG5cblxuXG4gICAgICAvLyBzZWxmX2JvZHkuYWRkVmVsb2NpdHkoX3ZlYzNfMSk7XG4gICAgICAvLyBvdGhlcl9ib2R5LmFkZFZlbG9jaXR5KF92ZWMzXzIpO1xuXG4gICAgICAvLyBzZWxmX3JlbGF0aXZlX3ggPSBzZWxmX25vZGUueCgpO1xuICAgICAgLy8gc2VsZl9yZWxhdGl2ZV95ID0gc2VsZl9ub2RlLnkoKTtcbiAgICAgIC8vIHNlbGZfcmVsYXRpdmVfeiA9IHNlbGZfbm9kZS56KCk7XG4gICAgICAvL1xuICAgICAgLy8gb3RoZXJfcmVsYXRpdmVfeCA9IG90aGVyX25vZGUueCgpO1xuICAgICAgLy8gb3RoZXJfcmVsYXRpdmVfeSA9IG90aGVyX25vZGUueSgpO1xuICAgICAgLy8gb3RoZXJfcmVsYXRpdmVfeiA9IG90aGVyX25vZGUueigpO1xuXG4gICAgICAvLyBzZWxmX3JlbGF0aXZlID0gbmV3IEFtbW8uYnRWZWN0b3IzKCk7XG4gICAgICAvLyBzZWxmX3JlbGF0aXZlLnNldFgoKTtcblxuICAgICAgLy8gY29uc29sZS5sb2coJ2xpbmshJyk7XG4gICAgICAvLyBzZWxmX2JvZHkuYXBwZW5kQW5jaG9yKGRlc2NyaXB0aW9uLm4xLCBjb25uZWN0b3IsIHRydWUsIDAuNSk7XG4gICAgICAvLyBvdGhlcl9ib2R5LmFwcGVuZEFuY2hvcihkZXNjcmlwdGlvbi5uMiwgY29ubmVjdG9yLCB0cnVlLCAwLjUpO1xuICAgICAgLy8gY2xlYXJJbnRlcnZhbChfbG9vcCk7XG5cbiAgICAgIC8vIF92ZWMzXzEuc2V0WCgwKTtcbiAgICAgIC8vIF92ZWMzXzEuc2V0WSgwKTtcbiAgICAgIC8vIF92ZWMzXzEuc2V0WigwKTtcblxuICAgICAgLy8gc2VsZl9ib2R5LnNldFZlbG9jaXR5KF92ZWMzXzEpO1xuICAgICAgLy8gb3RoZXJfYm9keS5zZXRWZWxvY2l0eShfdmVjM18xKTtcblxuICAgICAgLy8gb3RoZXJfYm9keS5hZGRGb3JjZShcbiAgICAgIC8vICAgX3ZlYzNfMixcbiAgICAgIC8vICAgZGVzY3JpcHRpb24ubjJcbiAgICAgIC8vICk7XG5cbiAgICAgIC8vIGRlc2NyaXB0aW9uLm1vZGlmaWVyICo9IDEuNjtcbiAgICB9XG5cbiAgICBjb25zdCBtb2RpZmVyMiA9IGxpbmtlZCA/IDQwIDogMTtcblxuICAgIGZvcmNlX3ggKj0gTWF0aC5tYXgoZGlzdGFuY2UsIDEpICogZGVzY3JpcHRpb24ubW9kaWZpZXIgKiBtb2RpZmVyMjtcbiAgICBmb3JjZV95ICo9IE1hdGgubWF4KGRpc3RhbmNlLCAxKSAqIGRlc2NyaXB0aW9uLm1vZGlmaWVyICogbW9kaWZlcjI7XG4gICAgZm9yY2VfeiAqPSBNYXRoLm1heChkaXN0YW5jZSwgMSkgKiBkZXNjcmlwdGlvbi5tb2RpZmllciAqIG1vZGlmZXIyO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGZvcmNlX3gpO1xuICAgIF92ZWMzXzEuc2V0WShmb3JjZV95KTtcbiAgICBfdmVjM18xLnNldFooZm9yY2Vfeik7XG5cbiAgICBfdmVjM18yLnNldFgoLWZvcmNlX3gpO1xuICAgIF92ZWMzXzIuc2V0WSgtZm9yY2VfeSk7XG4gICAgX3ZlYzNfMi5zZXRaKC1mb3JjZV96KTtcblxuICAgIHNlbGZfYm9keS5hZGRWZWxvY2l0eShcbiAgICAgIF92ZWMzXzEsXG4gICAgICBkZXNjcmlwdGlvbi5uMVxuICAgICk7XG5cbiAgICBvdGhlcl9ib2R5LmFkZFZlbG9jaXR5KFxuICAgICAgX3ZlYzNfMixcbiAgICAgIGRlc2NyaXB0aW9uLm4yXG4gICAgKTtcblxuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICAvLyBzZWxmX3JlbGF0aXZlX3ggPSBudWxsO1xuICAgIC8vIH1cblxuXG5cbiAgICAvLyBpZiAoc2VsZl9yZWxhdGl2ZV94KSB7XG4gICAgLy8gICBfdmVjM18xLnNldFgoc2VsZl9yZWxhdGl2ZV94IC0gc2VsZl9ub2RlLngoKSk7XG4gICAgLy8gICBfdmVjM18xLnNldFkoc2VsZl9yZWxhdGl2ZV95IC0gc2VsZl9ub2RlLnkoKSk7XG4gICAgLy8gICBfdmVjM18xLnNldFooc2VsZl9yZWxhdGl2ZV96IC0gc2VsZl9ub2RlLnooKSk7XG4gICAgLy9cbiAgICAvLyAgIF92ZWMzXzIuc2V0WChvdGhlcl9yZWxhdGl2ZV94IC0gb3RoZXJfbm9kZS54KCkpO1xuICAgIC8vICAgX3ZlYzNfMi5zZXRZKG90aGVyX3JlbGF0aXZlX3kgLSBvdGhlcl9ub2RlLnkoKSk7XG4gICAgLy8gICBfdmVjM18yLnNldFoob3RoZXJfcmVsYXRpdmVfeiAtIG90aGVyX25vZGUueigpKTtcbiAgICAvLyB9IGVsc2Uge1xuXG4gICAgLy8gfVxuXG5cblxuXG4gICAgY2FjaGVkX2Rpc3RhbmNlID0gZGlzdGFuY2U7XG4gIH0sIDEwKTtcbn1cblxucHVibGljX2Z1bmN0aW9ucy5hcHBlbmRMaW5rID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIC8vIGNvbnNvbGUubG9nKEFtbW8pO1xuICAvLyBjb25zb2xlLmxvZyhuZXcgQW1tby5NYXRlcmlhbCgpKTtcblxuICAvLyB2YXIgX21hdCA9IG5ldyBBbW1vLk1hdGVyaWFsKCk7XG4gIC8vXG4gIC8vIF9tYXQuc2V0X21fa0FTVCgwKTtcbiAgLy8gX21hdC5zZXRfbV9rTFNUKDApO1xuICAvLyBfbWF0LnNldF9tX2tWU1QoMCk7XG4gIC8vXG4gIC8vIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnNlbGZdLmFwcGVuZExpbmsoXG4gIC8vICAgZGVzY3JpcHRpb24ubjEsXG4gIC8vICAgZGVzY3JpcHRpb24ubjIsXG4gIC8vICAgX21hdCxcbiAgLy8gICBmYWxzZVxuICAvLyApO1xuXG4gIF92ZWMzXzEuc2V0WCgxMDAwKTtcbiAgX3ZlYzNfMS5zZXRZKDApO1xuICBfdmVjM18xLnNldFooMCk7XG5cbiAgX29iamVjdHNbZGVzY3JpcHRpb24uc2VsZl0uYWRkRm9yY2UoXG4gICAgX3ZlYzNfMSxcbiAgICBkZXNjcmlwdGlvbi5uMVxuICApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZExpbmVhckpvaW50ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIC8vIGNvbnNvbGUubG9nKCdBbW1vJywgQW1tbyk7XG4gIHZhciBzcGVjcyA9IG5ldyBBbW1vLlNwZWNzKCk7XG4gIHZhciBfcG9zID0gZGVzY3JpcHRpb24uc3BlY3MucG9zaXRpb247XG5cbiAgc3BlY3Muc2V0X3Bvc2l0aW9uKG5ldyBBbW1vLmJ0VmVjdG9yMyhfcG9zWzBdLCBfcG9zWzFdLCBfcG9zWzJdKSk7XG4gIGlmIChkZXNjcmlwdGlvbi5zcGVjcy5lcnApIHNwZWNzLnNldF9lcnAoZGVzY3JpcHRpb24uc3BlY3MuZXJwKTtcbiAgaWYgKGRlc2NyaXB0aW9uLnNwZWNzLmNmbSkgc3BlY3Muc2V0X2NmbShkZXNjcmlwdGlvbi5zcGVjcy5jZm0pO1xuICBpZiAoZGVzY3JpcHRpb24uc3BlY3Muc3BsaXQpIHNwZWNzLnNldF9zcGxpdChkZXNjcmlwdGlvbi5zcGVjcy5zcGxpdCk7XG5cbiAgLy8gY29uc29sZS5sb2coc3BlY3MpO1xuICAvL1xuICAvLyAvLyBsam9pbnQuc2V0X21fcnBvcyhcbiAgLy8gLy8gICBuZXcgQW1tby5idFZlY3RvcjMoX3BvczFbMF0sIF9wb3MxWzFdLCBfcG9zMVsyXSksXG4gIC8vIC8vICAgbmV3IEFtbW8uYnRWZWN0b3IzKF9wb3MyWzBdLCBfcG9zMlsxXSwgX3BvczJbMl0pXG4gIC8vIC8vICk7XG4gIC8vXG4gIC8vIC8vIGNvbnNvbGUubG9nKCdsam9pbnQnLCBsam9pbnQpO1xuICAvL1xuXG4gIC8vIGNvbnNvbGUubG9nKCdib2R5JywgX29iamVjdHNbZGVzY3JpcHRpb24uYm9keV0pO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXVxuICAgIC5hcHBlbmRMaW5lYXJKb2ludChcbiAgICAgIHNwZWNzLFxuICAgICAgX29iamVjdHNbZGVzY3JpcHRpb24uYm9keV1cbiAgICApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZE9iamVjdCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgYm9keSwgbW90aW9uU3RhdGU7XG5cbiAgaWYgKGRlc2NyaXB0aW9uLnR5cGUuaW5kZXhPZignc29mdCcpICE9PSAtMSkge1xuICAgIGJvZHkgPSBjcmVhdGVTb2Z0Qm9keShkZXNjcmlwdGlvbik7XG5cbiAgICBjb25zdCBzYkNvbmZpZyA9IGJvZHkuZ2V0X21fY2ZnKCk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24udml0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF92aXRlcmF0aW9ucyhkZXNjcmlwdGlvbi52aXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnBpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfcGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5kaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2RpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24uY2l0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9jaXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucyk7XG4gICAgc2JDb25maWcuc2V0X2NvbGxpc2lvbnMoMHgxMSk7XG4gICAgc2JDb25maWcuc2V0X2tERihkZXNjcmlwdGlvbi5mcmljdGlvbik7XG4gICAgc2JDb25maWcuc2V0X2tEUChkZXNjcmlwdGlvbi5kYW1waW5nKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucHJlc3N1cmUpIHNiQ29uZmlnLnNldF9rUFIoZGVzY3JpcHRpb24ucHJlc3N1cmUpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5kcmFnKSBzYkNvbmZpZy5zZXRfa0RHKGRlc2NyaXB0aW9uLmRyYWcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5saWZ0KSBzYkNvbmZpZy5zZXRfa0xGKGRlc2NyaXB0aW9uLmxpZnQpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcykgc2JDb25maWcuc2V0X2tBSFIoZGVzY3JpcHRpb24uYW5jaG9ySGFyZG5lc3MpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5yaWdpZEhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0NIUihkZXNjcmlwdGlvbi5yaWdpZEhhcmRuZXNzKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi5rbHN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tMU1QoZGVzY3JpcHRpb24ua2xzdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmthc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0FTVChkZXNjcmlwdGlvbi5rYXN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua3ZzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rVlNUKGRlc2NyaXB0aW9uLmt2c3QpO1xuXG4gICAgQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TWFyZ2luKFxuICAgICAgdHlwZW9mIGRlc2NyaXB0aW9uLm1hcmdpbiAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwLjFcbiAgICApO1xuXG4gICAgLy8gQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TWFyZ2luKDApO1xuXG4gICAgLy8gQW1tby5jYXN0T2JqZWN0KGJvZHksIEFtbW8uYnRDb2xsaXNpb25PYmplY3QpLmdldENvbGxpc2lvblNoYXBlKCkuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIGJvZHkudHlwZSA9IDA7IC8vIFNvZnRCb2R5LlxuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgYm9keS5yb3BlID0gdHJ1ZTtcbiAgICBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRDbG90aE1lc2gnKSBib2R5LmNsb3RoID0gdHJ1ZTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIC8vIEB0ZXN0XG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBib2R5LnJvdGF0ZShfcXVhdCk7XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBib2R5LnRyYW5zbGF0ZShfdmVjM18xKTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5zY2FsZS54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uc2NhbGUueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnNjYWxlLnopO1xuICAgIGJvZHkuc2NhbGUoX3ZlYzNfMSk7XG5cbiAgICBib2R5LnNldFRvdGFsTWFzcyhkZXNjcmlwdGlvbi5tYXNzLCBmYWxzZSk7XG4gICAgd29ybGQuYWRkU29mdEJvZHkoYm9keSwgMSwgLTEpO1xuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFRyaW1lc2gnKSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9mYWNlcygpLnNpemUoKSAqIDM7XG4gICAgZWxzZSBpZiAoZGVzY3JpcHRpb24udHlwZSA9PT0gJ3NvZnRSb3BlTWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX25vZGVzKCkuc2l6ZSgpO1xuICAgIGVsc2UgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCkgKiAzO1xuXG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzKys7XG4gIH1cbiAgZWxzZSB7XG4gICAgbGV0IHNoYXBlID0gY3JlYXRlU2hhcGUoZGVzY3JpcHRpb24pO1xuXG4gICAgaWYgKCFzaGFwZSkgcmV0dXJuO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGNoaWxkcmVuIHRoZW4gdGhpcyBpcyBhIGNvbXBvdW5kIHNoYXBlXG4gICAgaWYgKGRlc2NyaXB0aW9uLmNoaWxkcmVuKSB7XG4gICAgICBjb25zdCBjb21wb3VuZF9zaGFwZSA9IG5ldyBBbW1vLmJ0Q29tcG91bmRTaGFwZSgpO1xuICAgICAgY29tcG91bmRfc2hhcGUuYWRkQ2hpbGRTaGFwZShfdHJhbnNmb3JtLCBzaGFwZSk7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGVzY3JpcHRpb24uY2hpbGRyZW4ubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgX2NoaWxkID0gZGVzY3JpcHRpb24uY2hpbGRyZW5baV07XG5cbiAgICAgICAgY29uc3QgdHJhbnMgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgICB0cmFucy5zZXRJZGVudGl0eSgpO1xuXG4gICAgICAgIF92ZWMzXzEuc2V0WChfY2hpbGQucG9zaXRpb25fb2Zmc2V0LngpO1xuICAgICAgICBfdmVjM18xLnNldFkoX2NoaWxkLnBvc2l0aW9uX29mZnNldC55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueik7XG4gICAgICAgIHRyYW5zLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgICBfcXVhdC5zZXRYKF9jaGlsZC5yb3RhdGlvbi54KTtcbiAgICAgICAgX3F1YXQuc2V0WShfY2hpbGQucm90YXRpb24ueSk7XG4gICAgICAgIF9xdWF0LnNldFooX2NoaWxkLnJvdGF0aW9uLnopO1xuICAgICAgICBfcXVhdC5zZXRXKF9jaGlsZC5yb3RhdGlvbi53KTtcbiAgICAgICAgdHJhbnMuc2V0Um90YXRpb24oX3F1YXQpO1xuXG4gICAgICAgIHNoYXBlID0gY3JlYXRlU2hhcGUoZGVzY3JpcHRpb24uY2hpbGRyZW5baV0pO1xuICAgICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKHRyYW5zLCBzaGFwZSk7XG4gICAgICAgIEFtbW8uZGVzdHJveSh0cmFucyk7XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gY29tcG91bmRfc2hhcGU7XG4gICAgICBfY29tcG91bmRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuICAgIH1cblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5zY2FsZS54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uc2NhbGUueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnNjYWxlLnopO1xuXG4gICAgc2hhcGUuc2V0TG9jYWxTY2FsaW5nKF92ZWMzXzEpO1xuICAgIHNoYXBlLnNldE1hcmdpbihcbiAgICAgIHR5cGVvZiBkZXNjcmlwdGlvbi5tYXJnaW4gIT09ICd1bmRlZmluZWQnID8gZGVzY3JpcHRpb24ubWFyZ2luIDogMFxuICAgICk7XG5cbiAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgX3ZlYzNfMS5zZXRZKDApO1xuICAgIF92ZWMzXzEuc2V0WigwKTtcbiAgICBzaGFwZS5jYWxjdWxhdGVMb2NhbEluZXJ0aWEoZGVzY3JpcHRpb24ubWFzcywgX3ZlYzNfMSk7XG5cbiAgICBfdHJhbnNmb3JtLnNldElkZW50aXR5KCk7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ucG9zaXRpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnkpO1xuICAgIF92ZWMzXzIuc2V0WihkZXNjcmlwdGlvbi5wb3NpdGlvbi56KTtcbiAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgIF9xdWF0LnNldFgoZGVzY3JpcHRpb24ucm90YXRpb24ueCk7XG4gICAgX3F1YXQuc2V0WShkZXNjcmlwdGlvbi5yb3RhdGlvbi55KTtcbiAgICBfcXVhdC5zZXRaKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnopO1xuICAgIF9xdWF0LnNldFcoZGVzY3JpcHRpb24ucm90YXRpb24udyk7XG4gICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICBtb3Rpb25TdGF0ZSA9IG5ldyBBbW1vLmJ0RGVmYXVsdE1vdGlvblN0YXRlKF90cmFuc2Zvcm0pOyAvLyAjVE9ETzogYnREZWZhdWx0TW90aW9uU3RhdGUgc3VwcG9ydHMgY2VudGVyIG9mIG1hc3Mgb2Zmc2V0IGFzIHNlY29uZCBhcmd1bWVudCAtIGltcGxlbWVudFxuICAgIGNvbnN0IHJiSW5mbyA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyhkZXNjcmlwdGlvbi5tYXNzLCBtb3Rpb25TdGF0ZSwgc2hhcGUsIF92ZWMzXzEpO1xuXG4gICAgcmJJbmZvLnNldF9tX2ZyaWN0aW9uKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICByYkluZm8uc2V0X21fcmVzdGl0dXRpb24oZGVzY3JpcHRpb24ucmVzdGl0dXRpb24pO1xuICAgIHJiSW5mby5zZXRfbV9saW5lYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIHJiSW5mby5zZXRfbV9hbmd1bGFyRGFtcGluZyhkZXNjcmlwdGlvbi5kYW1waW5nKTtcblxuICAgIGJvZHkgPSBuZXcgQW1tby5idFJpZ2lkQm9keShyYkluZm8pO1xuICAgIGJvZHkuc2V0QWN0aXZhdGlvblN0YXRlKGRlc2NyaXB0aW9uLnN0YXRlIHx8IDQpO1xuICAgIEFtbW8uZGVzdHJveShyYkluZm8pO1xuXG4gICAgaWYgKHR5cGVvZiBkZXNjcmlwdGlvbi5jb2xsaXNpb25fZmxhZ3MgIT09ICd1bmRlZmluZWQnKSBib2R5LnNldENvbGxpc2lvbkZsYWdzKGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyk7XG5cbiAgICBpZiAoZGVzY3JpcHRpb24uZ3JvdXAgJiYgZGVzY3JpcHRpb24ubWFzaykgd29ybGQuYWRkUmlnaWRCb2R5KGJvZHksIGRlc2NyaXB0aW9uLmdyb3VwLCBkZXNjcmlwdGlvbi5tYXNrKTtcbiAgICBlbHNlIHdvcmxkLmFkZFJpZ2lkQm9keShib2R5KTtcbiAgICBib2R5LnR5cGUgPSAxOyAvLyBSaWdpZEJvZHkuXG4gICAgX251bV9yaWdpZGJvZHlfb2JqZWN0cysrO1xuICB9XG5cbiAgYm9keS5hY3RpdmF0ZSgpO1xuXG4gIGJvZHkuaWQgPSBkZXNjcmlwdGlvbi5pZDtcbiAgX29iamVjdHNbYm9keS5pZF0gPSBib2R5O1xuICBfbW90aW9uX3N0YXRlc1tib2R5LmlkXSA9IG1vdGlvblN0YXRlO1xuXG4gIF9vYmplY3RzX2FtbW9bYm9keS5hID09PSB1bmRlZmluZWQgPyBib2R5LnB0ciA6IGJvZHkuYV0gPSBib2R5LmlkO1xuICBfbnVtX29iamVjdHMrKztcblxuICBzZW5kKHsgY21kOiAnb2JqZWN0UmVhZHknLCBwYXJhbXM6IGJvZHkuaWQgfSk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZFZlaGljbGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgY29uc3QgdmVoaWNsZV90dW5pbmcgPSBuZXcgQW1tby5idFZlaGljbGVUdW5pbmcoKTtcblxuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uRGFtcGluZyhkZXNjcmlwdGlvbi5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20oZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgdmVoaWNsZV90dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlKGRlc2NyaXB0aW9uLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcblxuICBjb25zdCB2ZWhpY2xlID0gbmV3IEFtbW8uYnRSYXljYXN0VmVoaWNsZShcbiAgICB2ZWhpY2xlX3R1bmluZyxcbiAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLFxuICAgIG5ldyBBbW1vLmJ0RGVmYXVsdFZlaGljbGVSYXljYXN0ZXIod29ybGQpXG4gICk7XG5cbiAgdmVoaWNsZS50dW5pbmcgPSB2ZWhpY2xlX3R1bmluZztcbiAgX29iamVjdHNbZGVzY3JpcHRpb24ucmlnaWRCb2R5XS5zZXRBY3RpdmF0aW9uU3RhdGUoNCk7XG4gIHZlaGljbGUuc2V0Q29vcmRpbmF0ZVN5c3RlbSgwLCAxLCAyKTtcblxuICB3b3JsZC5hZGRWZWhpY2xlKHZlaGljbGUpO1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gdmVoaWNsZTtcbn07XG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZVZlaGljbGUgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXSA9IG51bGw7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFkZFdoZWVsID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICBsZXQgdHVuaW5nID0gX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXS50dW5pbmc7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR1bmluZyAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0dW5pbmcgPSBuZXcgQW1tby5idFZlaGljbGVUdW5pbmcoKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX3N0aWZmbmVzcyk7XG4gICAgICB0dW5pbmcuc2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2NvbXByZXNzaW9uKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uRGFtcGluZyhkZXNjcmlwdGlvbi50dW5pbmcuc3VzcGVuc2lvbl9kYW1waW5nKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20oZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX3RyYXZlbCk7XG4gICAgICB0dW5pbmcuc2V0X21fbWF4U3VzcGVuc2lvbkZvcmNlKGRlc2NyaXB0aW9uLnR1bmluZy5tYXhfc3VzcGVuc2lvbl9mb3JjZSk7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueCk7XG4gICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLmNvbm5lY3Rpb25fcG9pbnQueik7XG5cbiAgICBfdmVjM18yLnNldFgoZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLngpO1xuICAgIF92ZWMzXzIuc2V0WShkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueSk7XG4gICAgX3ZlYzNfMi5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi56KTtcblxuICAgIF92ZWMzXzMuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9heGxlLngpO1xuICAgIF92ZWMzXzMuc2V0WShkZXNjcmlwdGlvbi53aGVlbF9heGxlLnkpO1xuICAgIF92ZWMzXzMuc2V0WihkZXNjcmlwdGlvbi53aGVlbF9heGxlLnopO1xuXG4gICAgX3ZlaGljbGVzW2Rlc2NyaXB0aW9uLmlkXS5hZGRXaGVlbChcbiAgICAgIF92ZWMzXzEsXG4gICAgICBfdmVjM18yLFxuICAgICAgX3ZlYzNfMyxcbiAgICAgIGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fcmVzdF9sZW5ndGgsXG4gICAgICBkZXNjcmlwdGlvbi53aGVlbF9yYWRpdXMsXG4gICAgICB0dW5pbmcsXG4gICAgICBkZXNjcmlwdGlvbi5pc19mcm9udF93aGVlbFxuICAgICk7XG4gIH1cblxuICBfbnVtX3doZWVscysrO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDEgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICYgKCAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdCApXG4gICAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgfVxuICBlbHNlIHZlaGljbGVyZXBvcnQgPSBbTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUXTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0U3RlZXJpbmcgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5zZXRTdGVlcmluZ1ZhbHVlKGRldGFpbHMuc3RlZXJpbmcsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRCcmFrZSA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldEJyYWtlKGRldGFpbHMuYnJha2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUVuZ2luZUZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uYXBwbHlFbmdpbmVGb3JjZShkZXRhaWxzLmZvcmNlLCBkZXRhaWxzLndoZWVsKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlT2JqZWN0ID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF9vYmplY3RzW2RldGFpbHMuaWRdLnR5cGUgPT09IDApIHtcbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMtLTtcbiAgICBfc29mdGJvZHlfcmVwb3J0X3NpemUgLT0gX29iamVjdHNbZGV0YWlscy5pZF0uZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgd29ybGQucmVtb3ZlU29mdEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICB9XG4gIGVsc2UgaWYgKF9vYmplY3RzW2RldGFpbHMuaWRdLnR5cGUgPT09IDEpIHtcbiAgICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzLS07XG4gICAgd29ybGQucmVtb3ZlUmlnaWRCb2R5KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgICBBbW1vLmRlc3Ryb3koX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0pO1xuICB9XG5cbiAgQW1tby5kZXN0cm95KF9vYmplY3RzW2RldGFpbHMuaWRdKTtcbiAgaWYgKF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKTtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBBbW1vLmRlc3Ryb3koX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuXG4gIF9vYmplY3RzX2FtbW9bX29iamVjdHNbZGV0YWlscy5pZF0uYSA9PT0gdW5kZWZpbmVkID8gX29iamVjdHNbZGV0YWlscy5pZF0uYSA6IF9vYmplY3RzW2RldGFpbHMuaWRdLnB0cl0gPSBudWxsO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9tb3Rpb25fc3RhdGVzW2RldGFpbHMuaWRdID0gbnVsbDtcblxuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIGlmIChfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSkgX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuICBfbnVtX29iamVjdHMtLTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMudXBkYXRlVHJhbnNmb3JtID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdCA9IF9vYmplY3RzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChfb2JqZWN0LnR5cGUgPT09IDEpIHtcbiAgICBfb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oX3RyYW5zZm9ybSk7XG5cbiAgICBpZiAoZGV0YWlscy5wb3MpIHtcbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvcy54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvcy55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvcy56KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzEpO1xuICAgIH1cblxuICAgIGlmIChkZXRhaWxzLnF1YXQpIHtcbiAgICAgIF9xdWF0LnNldFgoZGV0YWlscy5xdWF0LngpO1xuICAgICAgX3F1YXQuc2V0WShkZXRhaWxzLnF1YXQueSk7XG4gICAgICBfcXVhdC5zZXRaKGRldGFpbHMucXVhdC56KTtcbiAgICAgIF9xdWF0LnNldFcoZGV0YWlscy5xdWF0LncpO1xuICAgICAgX3RyYW5zZm9ybS5zZXRSb3RhdGlvbihfcXVhdCk7XG4gICAgfVxuXG4gICAgX29iamVjdC5zZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcbiAgICBfb2JqZWN0LmFjdGl2YXRlKCk7XG4gIH1cbiAgZWxzZSBpZiAoX29iamVjdC50eXBlID09PSAwKSB7XG4gICAgLy8gX29iamVjdC5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnRyYW5zZm9ybShfdHJhbnNmb3JtKTtcbiAgfVxufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVNYXNzID0gKGRldGFpbHMpID0+IHtcbiAgLy8gI1RPRE86IGNoYW5naW5nIGEgc3RhdGljIG9iamVjdCBpbnRvIGR5bmFtaWMgaXMgYnVnZ3lcbiAgX29iamVjdCA9IF9vYmplY3RzW2RldGFpbHMuaWRdO1xuXG4gIC8vIFBlciBodHRwOi8vd3d3LmJ1bGxldHBoeXNpY3Mub3JnL0J1bGxldC9waHBCQjMvdmlld3RvcGljLnBocD9wPSZmPTkmdD0zNjYzI3AxMzgxNlxuICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdCk7XG5cbiAgX3ZlYzNfMS5zZXRYKDApO1xuICBfdmVjM18xLnNldFkoMCk7XG4gIF92ZWMzXzEuc2V0WigwKTtcblxuICBfb2JqZWN0LnNldE1hc3NQcm9wcyhkZXRhaWxzLm1hc3MsIF92ZWMzXzEpO1xuICB3b3JsZC5hZGRSaWdpZEJvZHkoX29iamVjdCk7XG4gIF9vYmplY3QuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlDZW50cmFsSW1wdWxzZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsSW1wdWxzZShfdmVjM18xKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMuaW1wdWxzZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuaW1wdWxzZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMuaW1wdWxzZV96KTtcblxuICBfdmVjM18yLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMi5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzIuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5SW1wdWxzZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlUb3JxdWUgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy50b3JxdWVfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnRvcnF1ZV95KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMudG9ycXVlX3opO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5VG9ycXVlKFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwbHlDZW50cmFsRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Q2VudHJhbEZvcmNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUZvcmNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMuZm9yY2VfeCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLmZvcmNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5mb3JjZV96KTtcblxuICBfdmVjM18yLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMi5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzIuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFwcGx5Rm9yY2UoXG4gICAgX3ZlYzNfMSxcbiAgICBfdmVjM18yXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLm9uU2ltdWxhdGlvblJlc3VtZSA9ICgpID0+IHtcbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUgPSBEYXRlLm5vdygpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRBbmd1bGFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldEFuZ3VsYXJWZWxvY2l0eShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldExpbmVhclZlbG9jaXR5ID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRMaW5lYXJWZWxvY2l0eShcbiAgICBfdmVjM18xXG4gICk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldEFuZ3VsYXJGYWN0b3IoXG4gICAgX3ZlYzNfMVxuICApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRMaW5lYXJGYWN0b3IgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldERhbXBpbmcgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXREYW1waW5nKGRldGFpbHMubGluZWFyLCBkZXRhaWxzLmFuZ3VsYXIpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RNb3Rpb25UaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5zZXRDY2RNb3Rpb25UaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKGRldGFpbHMucmFkaXVzKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGxldCBjb25zdHJhaW50O1xuXG4gIHN3aXRjaCAoZGV0YWlscy50eXBlKSB7XG5cbiAgY2FzZSAncG9pbnQnOlxuICAgIHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFBvaW50MlBvaW50Q29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF92ZWMzXzFcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnaGluZ2UnOlxuICAgIHtcbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLmF4aXMueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLmF4aXMueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLmF4aXMueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0SGluZ2VDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yXG4gICAgICAgICk7XG5cbiAgICAgIH1cbiAgICAgIGVsc2Uge1xuICAgICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgX3ZlYzNfMy5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMy5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMixcbiAgICAgICAgICBfdmVjM18zLFxuICAgICAgICAgIF92ZWMzXzNcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnc2xpZGVyJzpcbiAgICB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcbiAgICAgIGNvbnN0IHRyYW5zZm9ybWEgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIHRyYW5zZm9ybWEuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlcihkZXRhaWxzLmF4aXMueCwgZGV0YWlscy5heGlzLnksIGRldGFpbHMuYXhpcy56KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBpZiAoZGV0YWlscy5vYmplY3RiKSB7XG4gICAgICAgIHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRTbGlkZXJDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRydWVcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgY29uc3RyYWludC50YSA9IHRyYW5zZm9ybWE7XG4gICAgICBjb25zdHJhaW50LnRiID0gdHJhbnNmb3JtYjtcblxuICAgICAgQW1tby5kZXN0cm95KHRyYW5zZm9ybWEpO1xuICAgICAgaWYgKHRyYW5zZm9ybWIgIT09IHVuZGVmaW5lZCkgQW1tby5kZXN0cm95KHRyYW5zZm9ybWIpO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAge1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIGNvbnN0IHRyYW5zZm9ybWIgPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3NpdGlvbmEueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3NpdGlvbmEueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRDb25lVHdpc3RDb25zdHJhaW50KFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICB0cmFuc2Zvcm1iXG4gICAgICApO1xuXG4gICAgICBjb25zdHJhaW50LnNldExpbWl0KE1hdGguUEksIDAsIE1hdGguUEkpO1xuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnZG9mJzpcbiAgICB7XG4gICAgICBsZXQgdHJhbnNmb3JtYjtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNhLnosIC1kZXRhaWxzLmF4aXNhLnksIC1kZXRhaWxzLmF4aXNhLngpO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGV0YWlscy5wb3NpdGlvbmIueCk7XG4gICAgICAgIF92ZWMzXzIuc2V0WShkZXRhaWxzLnBvc2l0aW9uYi55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICAgIHJvdGF0aW9uID0gdHJhbnNmb3JtYi5nZXRSb3RhdGlvbigpO1xuICAgICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYi56LCAtZGV0YWlscy5heGlzYi55LCAtZGV0YWlscy5heGlzYi54KTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RiXSxcbiAgICAgICAgICB0cmFuc2Zvcm1hLFxuICAgICAgICAgIHRyYW5zZm9ybWIsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEdlbmVyaWM2RG9mQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgZGVmYXVsdDpcbiAgICByZXR1cm47XG4gIH1cblxuICB3b3JsZC5hZGRDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuXG4gIGNvbnN0cmFpbnQuYSA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV07XG4gIGNvbnN0cmFpbnQuYiA9IF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl07XG5cbiAgY29uc3RyYWludC5lbmFibGVGZWVkYmFjaygpO1xuICBfY29uc3RyYWludHNbZGV0YWlscy5pZF0gPSBjb25zdHJhaW50O1xuICBfbnVtX2NvbnN0cmFpbnRzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKTsgLy8gbWVzc2FnZSBpZCAmICggIyBvZiBvYmplY3RzIHRvIHJlcG9ydCAqICMgb2YgdmFsdWVzIHBlciBvYmplY3QgKVxuICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gIH1cbiAgZWxzZSBjb25zdHJhaW50cmVwb3J0ID0gW01FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVF07XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnJlbW92ZUNvbnN0cmFpbnQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuXG4gIGlmIChjb25zdHJhaW50ICE9PSB1bmRlZmluZWQpIHtcbiAgICB3b3JsZC5yZW1vdmVDb25zdHJhaW50KGNvbnN0cmFpbnQpO1xuICAgIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gICAgX251bV9jb25zdHJhaW50cy0tO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkID0gKGRldGFpbHMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXTtcbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5lZCkgY29uc3RyYWludC5zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoZGV0YWlscy50aHJlc2hvbGQpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zaW11bGF0ZSA9IChwYXJhbXMgPSB7fSkgPT4ge1xuICBpZiAod29ybGQpIHtcbiAgICBpZiAocGFyYW1zLnRpbWVTdGVwICYmIHBhcmFtcy50aW1lU3RlcCA8IGZpeGVkVGltZVN0ZXApXG4gICAgICBwYXJhbXMudGltZVN0ZXAgPSBmaXhlZFRpbWVTdGVwO1xuXG4gICAgcGFyYW1zLm1heFN1YlN0ZXBzID0gcGFyYW1zLm1heFN1YlN0ZXBzIHx8IE1hdGguY2VpbChwYXJhbXMudGltZVN0ZXAgLyBmaXhlZFRpbWVTdGVwKTsgLy8gSWYgbWF4U3ViU3RlcHMgaXMgbm90IGRlZmluZWQsIGtlZXAgdGhlIHNpbXVsYXRpb24gZnVsbHkgdXAgdG8gZGF0ZVxuXG4gICAgd29ybGQuc3RlcFNpbXVsYXRpb24ocGFyYW1zLnRpbWVTdGVwLCBwYXJhbXMubWF4U3ViU3RlcHMsIGZpeGVkVGltZVN0ZXApO1xuXG4gICAgaWYgKF92ZWhpY2xlcy5sZW5ndGggPiAwKSByZXBvcnRWZWhpY2xlcygpO1xuICAgIHJlcG9ydENvbGxpc2lvbnMoKTtcbiAgICBpZiAoX2NvbnN0cmFpbnRzLmxlbmd0aCA+IDApIHJlcG9ydENvbnN0cmFpbnRzKCk7XG4gICAgcmVwb3J0V29ybGQoKTtcbiAgICBpZiAoX3NvZnRib2R5X2VuYWJsZWQpIHJlcG9ydFdvcmxkX3NvZnRib2RpZXMoKTtcbiAgfVxufTtcblxuLy8gQ29uc3RyYWludCBmdW5jdGlvbnNcbnB1YmxpY19mdW5jdGlvbnMuaGluZ2Vfc2V0TGltaXRzID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy5sb3csIHBhcmFtcy5oaWdoLCAwLCBwYXJhbXMuYmlhc19mYWN0b3IsIHBhcmFtcy5yZWxheGF0aW9uX2ZhY3Rvcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlQW5ndWxhck1vdG9yKHRydWUsIHBhcmFtcy52ZWxvY2l0eSwgcGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLmVuYWJsZU1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldExvd2VyTGluTGltaXQocGFyYW1zLmxpbl9sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckxpbkxpbWl0KHBhcmFtcy5saW5fdXBwZXIgfHwgMCk7XG5cbiAgY29uc3RyYWludC5zZXRMb3dlckFuZ0xpbWl0KHBhcmFtcy5hbmdfbG93ZXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0VXBwZXJBbmdMaW1pdChwYXJhbXMuYW5nX3VwcGVyIHx8IDApO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfc2V0UmVzdGl0dXRpb24gPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFNvZnRuZXNzTGltTGluKHBhcmFtcy5saW5lYXIgfHwgMCk7XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1BbmcocGFyYW1zLmFuZ3VsYXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBjb25zdHJhaW50LnNldE1heExpbk1vdG9yRm9yY2UocGFyYW1zLmFjY2VsZXJhdGlvbik7XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9kaXNhYmxlTGluZWFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRMaW5Nb3RvcihmYWxzZSk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4QW5nTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkQW5nTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X3NldExpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLnNldExpbWl0KHBhcmFtcy56LCBwYXJhbXMueSwgcGFyYW1zLngpOyAvLyBaWVggb3JkZXJcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2VuYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRNYXhNb3RvckltcHVsc2UocGFyYW1zLm1heF9pbXB1bHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF9xdWF0LnNldFgocGFyYW1zLngpO1xuICBfcXVhdC5zZXRZKHBhcmFtcy55KTtcbiAgX3F1YXQuc2V0WihwYXJhbXMueik7XG4gIF9xdWF0LnNldFcocGFyYW1zLncpO1xuXG4gIGNvbnN0cmFpbnQuc2V0TW90b3JUYXJnZXQoX3F1YXQpO1xuXG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uZXR3aXN0X2Rpc2FibGVNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuZW5hYmxlTW90b3IoZmFsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyTG93ZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRMaW5lYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0TGluZWFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3ZlYzNfMS5zZXRYKHBhcmFtcy54KTtcbiAgX3ZlYzNfMS5zZXRZKHBhcmFtcy55KTtcbiAgX3ZlYzNfMS5zZXRaKHBhcmFtcy56KTtcblxuICBjb25zdHJhaW50LnNldEFuZ3VsYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhclVwcGVyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBjb25zdCBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcbiAgbW90b3Iuc2V0X21fZW5hYmxlTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9sb0xpbWl0KHBhcmFtcy5sb3dfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV9oaUxpbWl0KHBhcmFtcy5oaWdoX2FuZ2xlKTtcbiAgbW90b3Iuc2V0X21fdGFyZ2V0VmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgbW90b3Iuc2V0X21fbWF4TW90b3JGb3JjZShwYXJhbXMubWF4X2ZvcmNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9kaXNhYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XSxcbiAgICBtb3RvciA9IGNvbnN0cmFpbnQuZ2V0Um90YXRpb25hbExpbWl0TW90b3IocGFyYW1zLndoaWNoKTtcblxuICBtb3Rvci5zZXRfbV9lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGQgPSAoKSA9PiB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiB3b3JsZHJlcG9ydC5sZW5ndGggPCAyICsgX251bV9yaWdpZGJvZHlfb2JqZWN0cyAqIFdPUkxEUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgK1xuICAgICAgKE1hdGguY2VpbChfbnVtX3JpZ2lkYm9keV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICk7XG5cbiAgICB3b3JsZHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuV09STERSRVBPUlQ7XG4gIH1cblxuICB3b3JsZHJlcG9ydFsxXSA9IF9udW1fcmlnaWRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgaSA9IDAsXG4gICAgICBpbmRleCA9IF9vYmplY3RzLmxlbmd0aDtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvYmplY3QgPSBfb2JqZWN0c1tpbmRleF07XG5cbiAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LnR5cGUgPT09IDEpIHsgLy8gUmlnaWRCb2RpZXMuXG4gICAgICAgIC8vICNUT0RPOiB3ZSBjYW4ndCB1c2UgY2VudGVyIG9mIG1hc3MgdHJhbnNmb3JtIHdoZW4gY2VudGVyIG9mIG1hc3MgY2FuIGNoYW5nZSxcbiAgICAgICAgLy8gICAgICAgIGJ1dCBnZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKCkgc2NyZXdzIHVwIG9uIG9iamVjdHMgdGhhdCBoYXZlIGJlZW4gbW92ZWRcbiAgICAgICAgLy8gb2JqZWN0LmdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oIHRyYW5zZm9ybSApO1xuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBvYmplY3QuZ2V0Q2VudGVyT2ZNYXNzVHJhbnNmb3JtKCk7XG4gICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgY29uc3Qgcm90YXRpb24gPSB0cmFuc2Zvcm0uZ2V0Um90YXRpb24oKTtcblxuICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGkrKykgKiBXT1JMRFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDFdID0gb3JpZ2luLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAzXSA9IG9yaWdpbi56KCk7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNF0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDVdID0gcm90YXRpb24ueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnooKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi53KCk7XG5cbiAgICAgICAgX3ZlY3RvciA9IG9iamVjdC5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA4XSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA5XSA9IF92ZWN0b3IueSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMF0gPSBfdmVjdG9yLnooKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldEFuZ3VsYXJWZWxvY2l0eSgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMV0gPSBfdmVjdG9yLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTJdID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEzXSA9IF92ZWN0b3IueigpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkgc2VuZCh3b3JsZHJlcG9ydC5idWZmZXIsIFt3b3JsZHJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSBzZW5kKHdvcmxkcmVwb3J0KTtcbn07XG5cbmNvbnN0IHJlcG9ydFdvcmxkX3NvZnRib2RpZXMgPSAoKSA9PiB7XG4gIC8vIFRPRE86IEFkZCBTVVBQT1JUVFJBTlNGRVJBQkxFLlxuXG4gIHNvZnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICArXG4gICAgX251bV9zb2Z0Ym9keV9vYmplY3RzICogMiArXG4gICAgX3NvZnRib2R5X3JlcG9ydF9zaXplICogNlxuICApO1xuXG4gIHNvZnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlNPRlRSRVBPUlQ7XG4gIHNvZnRyZXBvcnRbMV0gPSBfbnVtX3NvZnRib2R5X29iamVjdHM7IC8vIHJlY29yZCBob3cgbWFueSBvYmplY3RzIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMixcbiAgICAgIGluZGV4ID0gX29iamVjdHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9iamVjdCA9IF9vYmplY3RzW2luZGV4XTtcblxuICAgICAgaWYgKG9iamVjdCAmJiBvYmplY3QudHlwZSA9PT0gMCkgeyAvLyBTb2Z0Qm9kaWVzLlxuXG4gICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0XSA9IG9iamVjdC5pZDtcblxuICAgICAgICBjb25zdCBvZmZzZXRWZXJ0ID0gb2Zmc2V0ICsgMjtcblxuICAgICAgICBpZiAob2JqZWN0LnJvcGUgPT09IHRydWUpIHtcbiAgICAgICAgICBjb25zdCBub2RlcyA9IG9iamVjdC5nZXRfbV9ub2RlcygpO1xuICAgICAgICAgIGNvbnN0IHNpemUgPSBub2Rlcy5zaXplKCk7XG4gICAgICAgICAgc29mdHJlcG9ydFtvZmZzZXQgKyAxXSA9IHNpemU7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgY29uc3Qgbm9kZSA9IG5vZGVzLmF0KGkpO1xuICAgICAgICAgICAgY29uc3QgdmVydCA9IG5vZGUuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAzO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDMgKyAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG9iamVjdC5jbG90aCkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwgPSBub2RlLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogNjtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydC54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDFdID0gdmVydC55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydC56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSAtbm9ybWFsLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSAtbm9ybWFsLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSAtbm9ybWFsLnooKTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBvZmZzZXQgKz0gc2l6ZSAqIDYgKyAyO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgIGNvbnN0IGZhY2VzID0gb2JqZWN0LmdldF9tX2ZhY2VzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IGZhY2VzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBmYWNlID0gZmFjZXMuYXQoaSk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vZGUxID0gZmFjZS5nZXRfbV9uKDApO1xuICAgICAgICAgICAgY29uc3Qgbm9kZTIgPSBmYWNlLmdldF9tX24oMSk7XG4gICAgICAgICAgICBjb25zdCBub2RlMyA9IGZhY2UuZ2V0X21fbigyKTtcblxuICAgICAgICAgICAgY29uc3QgdmVydDEgPSBub2RlMS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0MiA9IG5vZGUyLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQzID0gbm9kZTMuZ2V0X21feCgpO1xuXG4gICAgICAgICAgICBjb25zdCBub3JtYWwxID0gbm9kZTEuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMiA9IG5vZGUyLmdldF9tX24oKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDMgPSBub2RlMy5nZXRfbV9uKCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG9mZiA9IG9mZnNldFZlcnQgKyBpICogMTg7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0MS55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDJdID0gdmVydDEueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDNdID0gbm9ybWFsMS54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDRdID0gbm9ybWFsMS55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDVdID0gbm9ybWFsMS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNl0gPSB2ZXJ0Mi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDddID0gdmVydDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA4XSA9IHZlcnQyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA5XSA9IG5vcm1hbDIueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMF0gPSBub3JtYWwyLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTFdID0gbm9ybWFsMi56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTJdID0gdmVydDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxM10gPSB2ZXJ0My55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE0XSA9IHZlcnQzLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNV0gPSBub3JtYWwzLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTZdID0gbm9ybWFsMy55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE3XSA9IG5vcm1hbDMueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMTggKyAyO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSBzZW5kKHNvZnRyZXBvcnQuYnVmZmVyLCBbc29mdHJlcG9ydC5idWZmZXJdKTtcbiAgLy8gZWxzZSBzZW5kKHNvZnRyZXBvcnQpO1xuICBzZW5kKHNvZnRyZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0Q29sbGlzaW9ucyA9ICgpID0+IHtcbiAgY29uc3QgZHAgPSB3b3JsZC5nZXREaXNwYXRjaGVyKCksXG4gICAgbnVtID0gZHAuZ2V0TnVtTWFuaWZvbGRzKCk7XG4gIC8vIF9jb2xsaWRlZCA9IGZhbHNlO1xuXG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb2xsaXNpb25yZXBvcnQubGVuZ3RoIDwgMiArIG51bSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArXG4gICAgICAgIChNYXRoLmNlaWwoX251bV9vYmplY3RzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDtcbiAgICB9XG4gIH1cblxuICBjb2xsaXNpb25yZXBvcnRbMV0gPSAwOyAvLyBob3cgbWFueSBjb2xsaXNpb25zIHdlJ3JlIHJlcG9ydGluZyBvblxuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgbnVtOyBpKyspIHtcbiAgICBjb25zdCBtYW5pZm9sZCA9IGRwLmdldE1hbmlmb2xkQnlJbmRleEludGVybmFsKGkpLFxuICAgICAgbnVtX2NvbnRhY3RzID0gbWFuaWZvbGQuZ2V0TnVtQ29udGFjdHMoKTtcblxuICAgIGlmIChudW1fY29udGFjdHMgPT09IDApIGNvbnRpbnVlO1xuXG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBudW1fY29udGFjdHM7IGorKykge1xuICAgICAgY29uc3QgcHQgPSBtYW5pZm9sZC5nZXRDb250YWN0UG9pbnQoaik7XG5cbiAgICAgIC8vIGlmICggcHQuZ2V0RGlzdGFuY2UoKSA8IDAgKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgKGNvbGxpc2lvbnJlcG9ydFsxXSsrKSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXRdID0gX29iamVjdHNfYW1tb1ttYW5pZm9sZC5nZXRCb2R5MCgpLnB0cl07XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMV0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkxKCkucHRyXTtcblxuICAgICAgX3ZlY3RvciA9IHB0LmdldF9tX25vcm1hbFdvcmxkT25CKCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgMl0gPSBfdmVjdG9yLngoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAzXSA9IF92ZWN0b3IueSgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDRdID0gX3ZlY3Rvci56KCk7XG4gICAgICBicmVhaztcbiAgICAgIC8vIH1cbiAgICAgIC8vIHNlbmQoX29iamVjdHNfYW1tbyk7XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSBzZW5kKGNvbGxpc2lvbnJlcG9ydC5idWZmZXIsIFtjb2xsaXNpb25yZXBvcnQuYnVmZmVyXSk7XG4gIGVsc2Ugc2VuZChjb2xsaXNpb25yZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0VmVoaWNsZXMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmICh2ZWhpY2xlcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3doZWVscyAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICAgIHZlaGljbGVyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICtcbiAgICAgICAgKE1hdGguY2VpbChfbnVtX3doZWVscyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGogPSAwLFxuICAgICAgaW5kZXggPSBfdmVoaWNsZXMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfdmVoaWNsZXNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IHZlaGljbGUgPSBfdmVoaWNsZXNbaW5kZXhdO1xuXG4gICAgICAgIGZvciAoaiA9IDA7IGogPCB2ZWhpY2xlLmdldE51bVdoZWVscygpOyBqKyspIHtcbiAgICAgICAgICAvLyB2ZWhpY2xlLnVwZGF0ZVdoZWVsVHJhbnNmb3JtKCBqLCB0cnVlICk7XG4gICAgICAgICAgLy8gdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbFRyYW5zZm9ybVdTKCBqICk7XG4gICAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gdmVoaWNsZS5nZXRXaGVlbEluZm8oaikuZ2V0X21fd29ybGRUcmFuc2Zvcm0oKTtcblxuICAgICAgICAgIGNvbnN0IG9yaWdpbiA9IHRyYW5zZm9ybS5nZXRPcmlnaW4oKTtcbiAgICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgICBjb25zdCBvZmZzZXQgPSAxICsgKGkrKykgKiBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyAxXSA9IGo7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDRdID0gb3JpZ2luLnooKTtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi54KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA2XSA9IHJvdGF0aW9uLnkoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDddID0gcm90YXRpb24ueigpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgOF0gPSByb3RhdGlvbi53KCk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaiAhPT0gMCkgc2VuZCh2ZWhpY2xlcmVwb3J0LmJ1ZmZlciwgW3ZlaGljbGVyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaiAhPT0gMCkgc2VuZCh2ZWhpY2xlcmVwb3J0KTtcbiAgfVxufTtcblxuY29uc3QgcmVwb3J0Q29uc3RyYWludHMgPSBmdW5jdGlvbiAoKSB7XG4gIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSkge1xuICAgIGlmIChjb25zdHJhaW50cmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX2NvbnN0cmFpbnRzICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgY29uc3RyYWludHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgK1xuICAgICAgICAoTWF0aC5jZWlsKF9udW1fY29uc3RyYWludHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSAvLyAjIG9mIHZhbHVlcyBuZWVkZWQgKiBpdGVtIHNpemVcbiAgICAgICk7XG4gICAgICBjb25zdHJhaW50cmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIHtcbiAgICBsZXQgb2Zmc2V0ID0gMCxcbiAgICAgIGkgPSAwLFxuICAgICAgaW5kZXggPSBfY29uc3RyYWludHMubGVuZ2h0O1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGlmIChfY29uc3RyYWludHNbaW5kZXhdKSB7XG4gICAgICAgIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbaW5kZXhdO1xuICAgICAgICBjb25zdCBvZmZzZXRfYm9keSA9IGNvbnN0cmFpbnQuYTtcbiAgICAgICAgY29uc3QgdHJhbnNmb3JtID0gY29uc3RyYWludC50YTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIG9mZnNldCA9IDEgKyAoaSsrKSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXRdID0gaW5kZXg7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvZmZzZXRfYm9keS5pZDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi54O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnk7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4uejtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA1XSA9IGNvbnN0cmFpbnQuZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkKCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIGkgIT09IDApIHNlbmQoY29uc3RyYWludHJlcG9ydC5idWZmZXIsIFtjb25zdHJhaW50cmVwb3J0LmJ1ZmZlcl0pO1xuICAgIGVsc2UgaWYgKGkgIT09IDApIHNlbmQoY29uc3RyYWludHJlcG9ydCk7XG4gIH1cbn07XG5cbnNlbGYub25tZXNzYWdlID0gZnVuY3Rpb24gKGV2ZW50KSB7XG4gIGlmIChldmVudC5kYXRhIGluc3RhbmNlb2YgRmxvYXQzMkFycmF5KSB7XG4gICAgLy8gdHJhbnNmZXJhYmxlIG9iamVjdFxuICAgIHN3aXRjaCAoZXZlbnQuZGF0YVswXSkge1xuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgIHtcbiAgICAgICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAge1xuICAgICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgIHtcbiAgICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAge1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgZGVmYXVsdDpcbiAgICB9XG5cbiAgICByZXR1cm47XG4gIH1cbiAgZWxzZSBpZiAoZXZlbnQuZGF0YS5jbWQgJiYgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0pIHB1YmxpY19mdW5jdGlvbnNbZXZlbnQuZGF0YS5jbWRdKGV2ZW50LmRhdGEucGFyYW1zKTtcbn07XG5cbnNlbGYucmVjZWl2ZSA9IHNlbGYub25tZXNzYWdlO1xuXG5cblxuXG59KTsiLCJpbXBvcnQgV29ybGRNb2R1bGVCYXNlIGZyb20gJy4vY29yZS9Xb3JsZE1vZHVsZUJhc2UnO1xuXG5pbXBvcnQge1xuICBhZGRPYmplY3RDaGlsZHJlbixcbiAgTUVTU0FHRV9UWVBFUyxcbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMU1hdHJpeDQsXG4gIFJFUE9SVF9JVEVNU0laRSxcbiAgQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFLFxuICBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFLFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFXG59IGZyb20gJy4uL2FwaSc7XG5cbmltcG9ydCBQaHlzaWNzV29ya2VyIGZyb20gJ3dvcmtlciEuLi93b3JrZXIuanMnO1xuXG5leHBvcnQgY2xhc3MgV29ybGRNb2R1bGUgZXh0ZW5kcyBXb3JsZE1vZHVsZUJhc2Uge1xuICBjb25zdHJ1Y3RvciguLi5hcmdzKSB7XG4gICAgc3VwZXIoLi4uYXJncyk7XG5cbiAgICB0aGlzLndvcmtlciA9IG5ldyBQaHlzaWNzV29ya2VyKCk7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSA9IHRoaXMud29ya2VyLndlYmtpdFBvc3RNZXNzYWdlIHx8IHRoaXMud29ya2VyLnBvc3RNZXNzYWdlO1xuXG4gICAgdGhpcy5pc0xvYWRlZCA9IGZhbHNlO1xuXG4gICAgY29uc3Qgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcblxuICAgIHRoaXMubG9hZGVyID0gbmV3IFByb21pc2UoKHJlc29sdmUsIHJlamVjdCkgPT4ge1xuICAgICAgLy8gaWYgKG9wdGlvbnMud2FzbSkge1xuICAgICAgLy8gICBmZXRjaChvcHRpb25zLndhc20pXG4gICAgICAvLyAgICAgLnRoZW4ocmVzcG9uc2UgPT4gcmVzcG9uc2UuYXJyYXlCdWZmZXIoKSlcbiAgICAgIC8vICAgICAudGhlbihidWZmZXIgPT4ge1xuICAgICAgLy8gICAgICAgb3B0aW9ucy53YXNtQnVmZmVyID0gYnVmZmVyO1xuICAgICAgLy9cbiAgICAgIC8vICAgICAgIHRoaXMuZXhlY3V0ZSgnaW5pdCcsIG9wdGlvbnMpO1xuICAgICAgLy8gICAgICAgcmVzb2x2ZSgpO1xuICAgICAgLy8gICAgIH0pO1xuICAgICAgLy8gfSBlbHNlIHtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdpbml0Jywgb3B0aW9ucyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIC8vIH1cbiAgICB9KTtcblxuICAgIHRoaXMubG9hZGVyLnRoZW4oKCkgPT4ge3RoaXMuaXNMb2FkZWQgPSB0cnVlfSk7XG5cbiAgICAvLyBUZXN0IFNVUFBPUlRfVFJBTlNGRVJBQkxFXG5cbiAgICBjb25zdCBhYiA9IG5ldyBBcnJheUJ1ZmZlcigxKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKGFiLCBbYWJdKTtcbiAgICB0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFID0gKGFiLmJ5dGVMZW5ndGggPT09IDApO1xuXG4gICAgdGhpcy5zZXR1cCgpO1xuICB9XG5cbiAgc2VuZCguLi5hcmdzKSB7XG4gICAgdGhpcy53b3JrZXIudHJhbnNmZXJhYmxlTWVzc2FnZSguLi5hcmdzKTtcbiAgfVxuXG4gIHJlY2VpdmUoY2FsbGJhY2spIHtcbiAgICB0aGlzLndvcmtlci5hZGRFdmVudExpc3RlbmVyKCdtZXNzYWdlJywgY2FsbGJhY2spO1xuICB9XG59XG4iLCJpbXBvcnQge1ZlY3RvcjMsIFF1YXRlcm5pb259IGZyb20gJ3RocmVlJztcblxuY29uc3QgcHJvcGVydGllcyA9IHtcbiAgcG9zaXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQodmVjdG9yMykge1xuICAgICAgY29uc3QgcG9zID0gdGhpcy5fbmF0aXZlLnBvc2l0aW9uO1xuICAgICAgY29uc3Qgc2NvcGUgPSB0aGlzO1xuXG4gICAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwb3MsIHtcbiAgICAgICAgeDoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl94O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeCkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ggPSB4O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgeToge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl95O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeSkge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3kgPSB5O1xuICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgejoge1xuICAgICAgICAgIGdldCgpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLl96O1xuICAgICAgICAgIH0sXG5cbiAgICAgICAgICBzZXQoeikge1xuICAgICAgICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIHRoaXMuX3ogPSB6O1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSk7XG5cbiAgICAgIHNjb3BlLl9fZGlydHlQb3NpdGlvbiA9IHRydWU7XG5cbiAgICAgIHBvcy5jb3B5KHZlY3RvcjMpO1xuICAgIH1cbiAgfSxcblxuICBxdWF0ZXJuaW9uOiB7XG4gICAgZ2V0KCkge1xuICAgICAgdGhpcy5fX2Nfcm90ID0gdHJ1ZTtcbiAgICAgIHJldHVybiB0aGlzLm5hdGl2ZS5xdWF0ZXJuaW9uO1xuICAgIH0sXG5cbiAgICBzZXQocXVhdGVybmlvbikge1xuICAgICAgY29uc3QgcXVhdCA9IHRoaXMuX25hdGl2ZS5xdWF0ZXJuaW9uLFxuICAgICAgICBuYXRpdmUgPSB0aGlzLl9uYXRpdmU7XG5cbiAgICAgIHF1YXQuY29weShxdWF0ZXJuaW9uKTtcblxuICAgICAgcXVhdC5vbkNoYW5nZSgoKSA9PiB7XG4gICAgICAgIGlmICh0aGlzLl9fY19yb3QpIHtcbiAgICAgICAgICBpZiAobmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgdGhpcy5fX2Nfcm90ID0gZmFsc2U7XG4gICAgICAgICAgICBuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH0sXG5cbiAgcm90YXRpb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMuX25hdGl2ZS5yb3RhdGlvbjtcbiAgICB9LFxuXG4gICAgc2V0KGV1bGVyKSB7XG4gICAgICBjb25zdCByb3QgPSB0aGlzLl9uYXRpdmUucm90YXRpb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIoZXVsZXIpKTtcblxuICAgICAgcm90Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIHRoaXMucXVhdGVybmlvbi5jb3B5KG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKHJvdCkpO1xuICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSB0cnVlO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gd3JhcFBoeXNpY3NQcm90b3R5cGUoc2NvcGUpIHtcbiAgZm9yIChsZXQga2V5IGluIHByb3BlcnRpZXMpIHtcbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoc2NvcGUsIGtleSwge1xuICAgICAgZ2V0OiBwcm9wZXJ0aWVzW2tleV0uZ2V0LmJpbmQoc2NvcGUpLFxuICAgICAgc2V0OiBwcm9wZXJ0aWVzW2tleV0uc2V0LmJpbmQoc2NvcGUpLFxuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9uQ29weShzb3VyY2UpIHtcbiAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG5cbiAgY29uc3QgcGh5c2ljcyA9IHRoaXMudXNlKCdwaHlzaWNzJyk7XG4gIGNvbnN0IHNvdXJjZVBoeXNpY3MgPSBzb3VyY2UudXNlKCdwaHlzaWNzJyk7XG5cbiAgdGhpcy5tYW5hZ2VyLm1vZHVsZXMucGh5c2ljcyA9IHBoeXNpY3MuY2xvbmUodGhpcy5tYW5hZ2VyKTtcblxuICBwaHlzaWNzLmRhdGEgPSB7Li4uc291cmNlUGh5c2ljcy5kYXRhfTtcbiAgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuICBpZiAocGh5c2ljcy5kYXRhLmlzU29mdGJvZHkpIHBoeXNpY3MuZGF0YS5pc1NvZnRCb2R5UmVzZXQgPSBmYWxzZTtcblxuICB0aGlzLnBvc2l0aW9uID0gdGhpcy5wb3NpdGlvbi5jbG9uZSgpO1xuICB0aGlzLnJvdGF0aW9uID0gdGhpcy5yb3RhdGlvbi5jbG9uZSgpO1xuICB0aGlzLnF1YXRlcm5pb24gPSB0aGlzLnF1YXRlcm5pb24uY2xvbmUoKTtcblxuICByZXR1cm4gc291cmNlO1xufVxuXG5mdW5jdGlvbiBvbldyYXAoKSB7XG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xufVxuXG5jbGFzcyBBUEkge1xuICBhcHBseUNlbnRyYWxJbXB1bHNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxJbXB1bHNlJywge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZvcmNlLngsIHk6IGZvcmNlLnksIHo6IGZvcmNlLnp9KTtcbiAgfVxuXG4gIGFwcGx5SW1wdWxzZShmb3JjZSwgb2Zmc2V0KSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUltcHVsc2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgaW1wdWxzZV94OiBmb3JjZS54LFxuICAgICAgaW1wdWxzZV95OiBmb3JjZS55LFxuICAgICAgaW1wdWxzZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseVRvcnF1ZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlUb3JxdWUnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgdG9ycXVlX3g6IGZvcmNlLngsXG4gICAgICB0b3JxdWVfeTogZm9yY2UueSxcbiAgICAgIHRvcnF1ZV96OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUNlbnRyYWxGb3JjZShmb3JjZSkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlDZW50cmFsRm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgeDogZm9yY2UueCxcbiAgICAgIHk6IGZvcmNlLnksXG4gICAgICB6OiBmb3JjZS56XG4gICAgfSk7XG4gIH1cblxuICBhcHBseUZvcmNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Rm9yY2UnLCB7XG4gICAgICBpZDogdGhpcy5kYXRhLmlkLFxuICAgICAgZm9yY2VfeDogZm9yY2UueCxcbiAgICAgIGZvcmNlX3k6IGZvcmNlLnksXG4gICAgICBmb3JjZV96OiBmb3JjZS56LFxuICAgICAgeDogb2Zmc2V0LngsXG4gICAgICB5OiBvZmZzZXQueSxcbiAgICAgIHo6IG9mZnNldC56XG4gICAgfSk7XG4gIH1cblxuICBnZXRBbmd1bGFyVmVsb2NpdHkoKSB7XG4gICAgcmV0dXJuIHRoaXMuZGF0YS5hbmd1bGFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRBbmd1bGFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhclZlbG9jaXR5JyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiB2ZWxvY2l0eS54LCB5OiB2ZWxvY2l0eS55LCB6OiB2ZWxvY2l0eS56fVxuICAgICk7XG4gIH1cblxuICBnZXRMaW5lYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmxpbmVhclZlbG9jaXR5O1xuICB9XG5cbiAgc2V0TGluZWFyVmVsb2NpdHkodmVsb2NpdHkpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJGYWN0b3IoZmFjdG9yKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldEFuZ3VsYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldExpbmVhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0TGluZWFyRmFjdG9yJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB4OiBmYWN0b3IueCwgeTogZmFjdG9yLnksIHo6IGZhY3Rvci56fVxuICAgICk7XG4gIH1cblxuICBzZXREYW1waW5nKGxpbmVhciwgYW5ndWxhcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXREYW1waW5nJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCBsaW5lYXIsIGFuZ3VsYXJ9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZE1vdGlvblRocmVzaG9sZCh0aHJlc2hvbGQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0Q2NkTW90aW9uVGhyZXNob2xkJyxcbiAgICAgIHtpZDogdGhpcy5kYXRhLmlkLCB0aHJlc2hvbGR9XG4gICAgKTtcbiAgfVxuXG4gIHNldENjZFN3ZXB0U3BoZXJlUmFkaXVzKHJhZGl1cykge1xuICAgIHRoaXMuZXhlY3V0ZSgnc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgcmFkaXVzfSk7XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgZXh0ZW5kcyBBUEkge1xuICBzdGF0aWMgcmlnaWRib2R5ID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBsaW5lYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBhbmd1bGFyVmVsb2NpdHk6IG5ldyBWZWN0b3IzKCksXG4gICAgbWFzczogMTAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMFxuICB9KTtcblxuICBzdGF0aWMgc29mdGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIHJlc3RpdHV0aW9uOiAwLjMsXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBwcmVzc3VyZTogMTAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZSxcbiAgICBpc1NvZnRCb2R5UmVzZXQ6IGZhbHNlXG4gIH0pO1xuXG4gIHN0YXRpYyByb3BlID0gKCkgPT4gKHtcbiAgICB0b3VjaGVzOiBbXSxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIHNjYWxlOiBuZXcgVmVjdG9yMygxLCAxLCAxKSxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBrbHN0OiAwLjksXG4gICAga3ZzdDogMC45LFxuICAgIGthc3Q6IDAuOSxcbiAgICBwaXRlcmF0aW9uczogMSxcbiAgICB2aXRlcmF0aW9uczogMCxcbiAgICBkaXRlcmF0aW9uczogMCxcbiAgICBjaXRlcmF0aW9uczogNCxcbiAgICBhbmNob3JIYXJkbmVzczogMC43LFxuICAgIHJpZ2lkSGFyZG5lc3M6IDEsXG4gICAgaXNTb2Z0Ym9keTogdHJ1ZVxuICB9KTtcblxuICBzdGF0aWMgY2xvdGggPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgZGFtcGluZzogMCxcbiAgICBtYXJnaW46IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMVxuICB9KTtcblxuICBjb25zdHJ1Y3RvcihkZWZhdWx0cywgZGF0YSkge1xuICAgIHN1cGVyKCk7XG4gICAgdGhpcy5kYXRhID0gT2JqZWN0LmFzc2lnbihkZWZhdWx0cywgZGF0YSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIHdyYXBQaHlzaWNzUHJvdG90eXBlKHRoaXMpO1xuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgbWFuYWdlci5kZWZpbmUoJ3BoeXNpY3MnKTtcblxuICAgIHRoaXMuZXhlY3V0ZSA9ICguLi5kYXRhKSA9PiB7XG4gICAgICByZXR1cm4gbWFuYWdlci5oYXMoJ21vZHVsZTp3b3JsZCcpXG4gICAgICA/IG1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5leGVjdXRlKC4uLmRhdGEpXG4gICAgICA6ICgpID0+IHt9O1xuICAgIH07XG4gIH1cblxuICB1cGRhdGVEYXRhKGNhbGxiYWNrKSB7XG4gICAgdGhpcy5icmlkZ2UuZ2VvbWV0cnkgPSBmdW5jdGlvbiAoZ2VvbWV0cnksIG1vZHVsZSkge1xuICAgICAgaWYgKCFjYWxsYmFjaykgcmV0dXJuIGdlb21ldHJ5O1xuXG4gICAgICBjb25zdCByZXN1bHQgPSBjYWxsYmFjayhnZW9tZXRyeSwgbW9kdWxlKTtcbiAgICAgIHJldHVybiByZXN1bHQgPyByZXN1bHQgOiBnZW9tZXRyeTtcbiAgICB9XG4gIH1cblxuICBjbG9uZShtYW5hZ2VyKSB7XG4gICAgY29uc3QgY2xvbmUgPSBuZXcgdGhpcy5jb25zdHJ1Y3RvcigpO1xuICAgIGNsb25lLmRhdGEgPSB7Li4udGhpcy5kYXRhfTtcbiAgICBjbG9uZS5icmlkZ2UuZ2VvbWV0cnkgPSB0aGlzLmJyaWRnZS5nZW9tZXRyeTtcbiAgICB0aGlzLm1hbmFnZXIuYXBwbHkoY2xvbmUsIFttYW5hZ2VyXSk7XG5cbiAgICByZXR1cm4gY2xvbmU7XG4gIH1cblxuICBicmlkZ2UgPSB7XG4gICAgb25Db3B5LFxuICAgIG9uV3JhcFxuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQm94TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdib3gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZGF0YS53aWR0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGRhdGEuZGVwdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29tcG91bmRNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbXBvdW5kJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbi8vIFRPRE86IFRlc3QgQ2Fwc3VsZU1vZHVsZSBpbiBhY3Rpb24uXG5leHBvcnQgY2xhc3MgQ2Fwc3VsZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY2Fwc3VsZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZGF0YS5kZXB0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25jYXZlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb25jYXZlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBkYXRhLmRhdGEgPSB0aGlzLmdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KTtcbiAgICB9KTtcbiAgfVxuXG4gIGdlb21ldHJ5UHJvY2Vzc29yKGdlb21ldHJ5KSB7XG4gICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICBjb25zdCBkYXRhID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/XG4gICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogOSk7XG5cbiAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgIGNvbnN0IHZlcnRpY2VzID0gZ2VvbWV0cnkudmVydGljZXM7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZ2VvbWV0cnkuZmFjZXMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgZmFjZSA9IGdlb21ldHJ5LmZhY2VzW2ldO1xuXG4gICAgICAgIGNvbnN0IHZBID0gdmVydGljZXNbZmFjZS5hXTtcbiAgICAgICAgY29uc3QgdkIgPSB2ZXJ0aWNlc1tmYWNlLmJdO1xuICAgICAgICBjb25zdCB2QyA9IHZlcnRpY2VzW2ZhY2UuY107XG5cbiAgICAgICAgY29uc3QgaTkgPSBpICogOTtcblxuICAgICAgICBkYXRhW2k5XSA9IHZBLng7XG4gICAgICAgIGRhdGFbaTkgKyAxXSA9IHZBLnk7XG4gICAgICAgIGRhdGFbaTkgKyAyXSA9IHZBLno7XG5cbiAgICAgICAgZGF0YVtpOSArIDNdID0gdkIueDtcbiAgICAgICAgZGF0YVtpOSArIDRdID0gdkIueTtcbiAgICAgICAgZGF0YVtpOSArIDVdID0gdkIuejtcblxuICAgICAgICBkYXRhW2k5ICsgNl0gPSB2Qy54O1xuICAgICAgICBkYXRhW2k5ICsgN10gPSB2Qy55O1xuICAgICAgICBkYXRhW2k5ICsgOF0gPSB2Qy56O1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBkYXRhO1xuICB9O1xufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29uZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29uZScsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEucmFkaXVzID0gZGF0YS5yYWRpdXMgfHwgKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLngpIC8gMjtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgQ29udmV4TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb252ZXgnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuICAgICAgaWYgKCFnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBnZW9tZXRyeS5fYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuXG4gICAgICBkYXRhLmRhdGEgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID9cbiAgICAgICAgZ2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheSA6XG4gICAgICAgIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDeWxpbmRlck1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY3lsaW5kZXInLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZGF0YS53aWR0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5kZXB0aCA9IGRhdGEuZGVwdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnogLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4uejtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuaW1wb3J0IHtWZWN0b3IzLCBWZWN0b3IyLCBCdWZmZXJHZW9tZXRyeX0gZnJvbSAndGhyZWUnO1xuXG5leHBvcnQgY2xhc3MgSGVpZ2h0ZmllbGRNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2hlaWdodGZpZWxkJyxcbiAgICAgIHNpemU6IG5ldyBWZWN0b3IyKDEsIDEpLFxuICAgICAgYXV0b0FsaWduOiBmYWxzZSxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCB7eDogeGRpdiwgeTogeWRpdn0gPSBkYXRhLnNpemU7XG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDogZ2VvbWV0cnkudmVydGljZXM7XG4gICAgICBsZXQgc2l6ZSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgPyB2ZXJ0cy5sZW5ndGggLyAzIDogdmVydHMubGVuZ3RoO1xuXG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgY29uc3QgeHNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgY29uc3QgeXNpemUgPSBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuXG4gICAgICBkYXRhLnhwdHMgPSAodHlwZW9mIHhkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHhkaXYgKyAxO1xuICAgICAgZGF0YS55cHRzID0gKHR5cGVvZiB5ZGl2ID09PSAndW5kZWZpbmVkJykgPyBNYXRoLnNxcnQoc2l6ZSkgOiB5ZGl2ICsgMTtcblxuICAgICAgLy8gbm90ZSAtIHRoaXMgYXNzdW1lcyBvdXIgcGxhbmUgZ2VvbWV0cnkgaXMgc3F1YXJlLCB1bmxlc3Mgd2UgcGFzcyBpbiBzcGVjaWZpYyB4ZGl2IGFuZCB5ZGl2XG4gICAgICBkYXRhLmFic01heEhlaWdodCA9IE1hdGgubWF4KGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55LCBNYXRoLmFicyhnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueSkpO1xuXG4gICAgICBjb25zdCBwb2ludHMgPSBuZXcgRmxvYXQzMkFycmF5KHNpemUpLFxuICAgICAgICB4cHRzID0gZGF0YS54cHRzLFxuICAgICAgICB5cHRzID0gZGF0YS55cHRzO1xuXG4gICAgICB3aGlsZSAoc2l6ZS0tKSB7XG4gICAgICAgIGNvbnN0IHZOdW0gPSBzaXplICUgeHB0cyArICgoeXB0cyAtIE1hdGgucm91bmQoKHNpemUgLyB4cHRzKSAtICgoc2l6ZSAlIHhwdHMpIC8geHB0cykpIC0gMSkgKiB5cHRzKTtcblxuICAgICAgICBpZiAoZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkgcG9pbnRzW3NpemVdID0gdmVydHNbdk51bSAqIDMgKyAxXTtcbiAgICAgICAgZWxzZSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtXS55O1xuICAgICAgfVxuXG4gICAgICBkYXRhLnBvaW50cyA9IHBvaW50cztcblxuICAgICAgZGF0YS5zY2FsZS5tdWx0aXBseShcbiAgICAgICAgbmV3IFZlY3RvcjMoeHNpemUgLyAoeHB0cyAtIDEpLCAxLCB5c2l6ZSAvICh5cHRzIC0gMSkpXG4gICAgICApO1xuXG4gICAgICBpZiAoZGF0YS5hdXRvQWxpZ24pIGdlb21ldHJ5LnRyYW5zbGF0ZSh4c2l6ZSAvIC0yLCAwLCB5c2l6ZSAvIC0yKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgUGxhbmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3BsYW5lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGRhdGEud2lkdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEubm9ybWFsID0gZGF0YS5ub3JtYWwgfHwgZ2VvbWV0cnkuZmFjZXNbMF0ubm9ybWFsLmNsb25lKCk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNwaGVyZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc3BoZXJlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nU3BoZXJlKSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdTcGhlcmUoKTtcbiAgICAgIGRhdGEucmFkaXVzID0gZGF0YS5yYWRpdXMgfHwgZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUucmFkaXVzO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFNvZnRib2R5TW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0VHJpbWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnNvZnRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBpZHhHZW9tZXRyeSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5zZXRJbmRleChcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyAoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyA+IDY1NTM1ID8gVWludDMyQXJyYXkgOiBVaW50MTZBcnJheSkoZ2VvbWV0cnkuZmFjZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShnZW9tZXRyeS5mYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBkYXRhLmFWZXJ0aWNlcyA9IGlkeEdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgICBkYXRhLmFJbmRpY2VzID0gaWR4R2VvbWV0cnkuaW5kZXguYXJyYXk7XG5cbiAgICAgIHJldHVybiBuZXcgQnVmZmVyR2VvbWV0cnkoKS5mcm9tR2VvbWV0cnkoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kQW5jaG9yKG9iamVjdCwgbm9kZSwgaW5mbHVlbmNlID0gMSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGV9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZnVuY3Rpb24gYXJyYXlNYXgoYXJyYXkpIHtcblx0aWYgKGFycmF5Lmxlbmd0aCA9PT0gMCkgcmV0dXJuIC0gSW5maW5pdHk7XG5cblx0dmFyIG1heCA9IGFycmF5WzBdO1xuXG5cdGZvciAobGV0IGkgPSAxLCBsID0gYXJyYXkubGVuZ3RoOyBpIDwgbDsgKysgaSApIHtcblx0XHRpZiAoYXJyYXlbIGkgXSA+IG1heCkgbWF4ID0gYXJyYXlbaV07XG5cdH1cblxuXHRyZXR1cm4gbWF4O1xufVxuXG5leHBvcnQgY2xhc3MgQ2xvdGhNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRDbG90aE1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5jbG90aCgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgY29uc3QgZ2VvbVBhcmFtcyA9IGdlb21ldHJ5LnBhcmFtZXRlcnM7XG5cbiAgICAgIGNvbnN0IGdlb20gPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5XG4gICAgICAgID8gZ2VvbWV0cnlcbiAgICAgICAgICA6ICgoKSA9PiB7XG4gICAgICAgICAgZ2VvbWV0cnkubWVyZ2VWZXJ0aWNlcygpO1xuXG4gICAgICAgICAgY29uc3QgYnVmZmVyR2VvbWV0cnkgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LmFkZEF0dHJpYnV0ZShcbiAgICAgICAgICAgICdwb3NpdGlvbicsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgRmxvYXQzMkFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAzXG4gICAgICAgICAgICApLmNvcHlWZWN0b3Izc0FycmF5KGdlb21ldHJ5LnZlcnRpY2VzKVxuICAgICAgICAgICk7XG5cblx0XHRcdFx0XHRjb25zdCBmYWNlcyA9IGdlb21ldHJ5LmZhY2VzLCBmYWNlc0xlbmd0aCA9IGZhY2VzLmxlbmd0aCwgdXZzID0gZ2VvbWV0cnkuZmFjZVZlcnRleFV2c1swXTtcblxuICAgICAgICAgIGNvbnN0IG5vcm1hbHNBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZmFjZXNMZW5ndGggKiAzKTtcbiAgICAgICAgICAvLyBjb25zdCB1dnNBcnJheSA9IG5ldyBBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAyKTtcbiAgICAgICAgICBjb25zdCB1dnNBcnJheSA9IG5ldyBGbG9hdDMyQXJyYXkoZmFjZXNMZW5ndGggKiAyKTtcbiAgICAgICAgICBjb25zdCB1dnNSZXBsYWNlZEFycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDYpO1xuXHRcdFx0XHRcdGNvbnN0IGZhY2VBcnJheSA9IG5ldyBVaW50MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBmYWNlc0xlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBpMyA9IGkgKiAzO1xuICAgICAgICAgICAgY29uc3QgaTYgPSBpICogNjtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IGZhY2VzW2ldLm5vcm1hbCB8fCBuZXcgVmVjdG9yMygpO1xuXG5cdFx0XHRcdFx0XHRmYWNlQXJyYXlbaTNdID0gZmFjZXNbaV0uYTtcbiAgICAgICAgICAgIGZhY2VBcnJheVtpMyArIDFdID0gZmFjZXNbaV0uYjtcbiAgICAgICAgICAgIGZhY2VBcnJheVtpMyArIDJdID0gZmFjZXNbaV0uYztcblxuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzXSA9IG5vcm1hbC54O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMV0gPSBub3JtYWwueTtcbiAgICAgICAgICAgIG5vcm1hbHNBcnJheVtpMyArIDJdID0gbm9ybWFsLno7XG5cbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmEgKiAyICsgMF0gPSB1dnNbaV1bMF0ueDsgLy8gYVxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYSAqIDIgKyAxXSA9IHV2c1tpXVswXS55O1xuXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5iICogMiArIDBdID0gdXZzW2ldWzFdLng7IC8vIGJcbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmIgKiAyICsgMV0gPSB1dnNbaV1bMV0ueTtcblxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYyAqIDIgKyAwXSA9IHV2c1tpXVsyXS54OyAvLyBjXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5jICogMiArIDFdID0gdXZzW2ldWzJdLnk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ25vcm1hbCcsXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBub3JtYWxzQXJyYXksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3V2JyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIHV2c0FycmF5LFxuICAgICAgICAgICAgICAyXG4gICAgICAgICAgICApXG4gICAgICAgICAgKTtcblxuXHRcdFx0XHRcdGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChhcnJheU1heChmYWNlcykgKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShmYWNlc0xlbmd0aCAqIDMpLFxuICAgICAgICAgICAgICAxXG4gICAgICAgICAgICApLmNvcHlJbmRpY2VzQXJyYXkoZmFjZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmZXJHZW9tZXRyeTtcbiAgICAgICAgfSkoKTtcblxuICAgICAgY29uc3QgdmVydHMgPSBnZW9tLmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGlmICghZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzKSBnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgPSAxO1xuICAgICAgaWYgKCFnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzKSBnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzID0gMTtcblxuICAgICAgY29uc3QgaWR4MDAgPSAwO1xuICAgICAgY29uc3QgaWR4MDEgPSBnZW9tUGFyYW1zLndpZHRoU2VnbWVudHM7XG4gICAgICBjb25zdCBpZHgxMCA9IChnZW9tUGFyYW1zLmhlaWdodFNlZ21lbnRzICsgMSkgKiAoZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSkgLSAoZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSk7XG4gICAgICBjb25zdCBpZHgxMSA9IHZlcnRzLmxlbmd0aCAvIDMgLSAxO1xuXG4gICAgICBkYXRhLmNvcm5lcnMgPSBbXG4gICAgICAgIHZlcnRzW2lkeDAxICogM10sIHZlcnRzW2lkeDAxICogMyArIDFdLCB2ZXJ0c1tpZHgwMSAqIDMgKyAyXSwgLy8gICDilZdcbiAgICAgICAgdmVydHNbaWR4MDAgKiAzXSwgdmVydHNbaWR4MDAgKiAzICsgMV0sIHZlcnRzW2lkeDAwICogMyArIDJdLCAvLyDilZRcbiAgICAgICAgdmVydHNbaWR4MTEgKiAzXSwgdmVydHNbaWR4MTEgKiAzICsgMV0sIHZlcnRzW2lkeDExICogMyArIDJdLCAvLyAgICAgICDilZ1cbiAgICAgICAgdmVydHNbaWR4MTAgKiAzXSwgdmVydHNbaWR4MTAgKiAzICsgMV0sIHZlcnRzW2lkeDEwICogMyArIDJdLCAvLyAgICAg4pWaXG4gICAgICBdO1xuXG4gICAgICBkYXRhLnNlZ21lbnRzID0gW2dlb21QYXJhbXMud2lkdGhTZWdtZW50cyArIDEsIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxXTtcblxuICAgICAgcmV0dXJuIGdlb207XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxuXG5cdGxpbmtOb2RlcyhvYmplY3QsIG4xLCBuMiwgbW9kaWZpZXIpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IGJvZHkgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnbGlua05vZGVzJywge1xuICAgICAgc2VsZixcblx0XHRcdGJvZHksXG4gICAgICBuMSwgLy8gc2VsZiBub2RlXG4gICAgICBuMiwgLy8gYm9keSBub2RlXG5cdFx0XHRtb2RpZmllclxuICAgIH0pO1xuICB9XG5cbiAgYXBwZW5kTGluZWFySm9pbnQob2JqZWN0LCBzcGVjcykge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgYm9keSA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRMaW5lYXJKb2ludCcsIHtcbiAgICAgIHNlbGYsXG4gICAgICBib2R5LFxuICAgICAgc3BlY3NcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtCdWZmZXJHZW9tZXRyeSwgQnVmZmVyQXR0cmlidXRlLCBWZWN0b3IzfSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBSb3BlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzb2Z0Um9wZU1lc2gnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yb3BlKClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIHtcbiAgICAgICAgZ2VvbWV0cnkgPSAoKCkgPT4ge1xuICAgICAgICAgIGNvbnN0IGJ1ZmYgPSBuZXcgQnVmZmVyR2VvbWV0cnkoKTtcblxuICAgICAgICAgIGJ1ZmYuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIHJldHVybiBidWZmO1xuICAgICAgICB9KSgpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBsZW5ndGggPSBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5Lmxlbmd0aCAvIDM7XG4gICAgICBjb25zdCB2ZXJ0ID0gbiA9PiBuZXcgVmVjdG9yMygpLmZyb21BcnJheShnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5LCBuKjMpO1xuXG4gICAgICBjb25zdCB2MSA9IHZlcnQoMCk7XG4gICAgICBjb25zdCB2MiA9IHZlcnQobGVuZ3RoIC0gMSk7XG5cbiAgICAgIGRhdGEuZGF0YSA9IFtcbiAgICAgICAgdjEueCwgdjEueSwgdjEueixcbiAgICAgICAgdjIueCwgdjIueSwgdjIueixcbiAgICAgICAgbGVuZ3RoXG4gICAgICBdO1xuXG4gICAgICByZXR1cm4gZ2VvbWV0cnk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UsIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMgPSB0cnVlKSB7XG4gICAgY29uc3QgbzEgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgbzIgPSBvYmplY3QudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcblxuICAgIHRoaXMuZXhlY3V0ZSgnYXBwZW5kQW5jaG9yJywge1xuICAgICAgb2JqOiBvMSxcbiAgICAgIG9iajI6IG8yLFxuICAgICAgbm9kZSxcbiAgICAgIGluZmx1ZW5jZSxcbiAgICAgIGNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXNcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtMb29wfSBmcm9tICd3aHMnO1xuXG5pbXBvcnQge1xuICBPYmplY3QzRCxcbiAgUXVhdGVybmlvbixcbiAgVmVjdG9yMyxcbiAgRXVsZXJcbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBQSV8yID0gTWF0aC5QSSAvIDI7XG5cbi8vIFRPRE86IEZpeCBET01cbmZ1bmN0aW9uIEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIoY2FtZXJhLCBtZXNoLCBwYXJhbXMpIHtcbiAgY29uc3QgdmVsb2NpdHlGYWN0b3IgPSAxO1xuICBsZXQgcnVuVmVsb2NpdHkgPSAwLjI1O1xuXG4gIG1lc2gudXNlKCdwaHlzaWNzJykuc2V0QW5ndWxhckZhY3Rvcih7eDogMCwgeTogMCwgejogMH0pO1xuICBjYW1lcmEucG9zaXRpb24uc2V0KDAsIDAsIDApO1xuXG4gIC8qIEluaXQgKi9cbiAgY29uc3QgcGxheWVyID0gbWVzaCxcbiAgICBwaXRjaE9iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHBpdGNoT2JqZWN0LmFkZChjYW1lcmEubmF0aXZlKTtcblxuICBjb25zdCB5YXdPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICB5YXdPYmplY3QucG9zaXRpb24ueSA9IHBhcmFtcy55cG9zOyAvLyBleWVzIGFyZSAyIG1ldGVycyBhYm92ZSB0aGUgZ3JvdW5kXG4gIHlhd09iamVjdC5hZGQocGl0Y2hPYmplY3QpO1xuXG4gIGNvbnN0IHF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG4gIGxldCBjYW5KdW1wID0gZmFsc2UsXG4gICAgLy8gTW92ZXMuXG4gICAgbW92ZUZvcndhcmQgPSBmYWxzZSxcbiAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZSxcbiAgICBtb3ZlTGVmdCA9IGZhbHNlLFxuICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuXG4gIHBsYXllci5vbignY29sbGlzaW9uJywgKG90aGVyT2JqZWN0LCB2LCByLCBjb250YWN0Tm9ybWFsKSA9PiB7XG4gICAgY29uc29sZS5sb2coY29udGFjdE5vcm1hbC55KTtcbiAgICBpZiAoY29udGFjdE5vcm1hbC55IDwgMC41KSAvLyBVc2UgYSBcImdvb2RcIiB0aHJlc2hvbGQgdmFsdWUgYmV0d2VlbiAwIGFuZCAxIGhlcmUhXG4gICAgICBjYW5KdW1wID0gdHJ1ZTtcbiAgfSk7XG5cbiAgY29uc3Qgb25Nb3VzZU1vdmUgPSBldmVudCA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGNvbnN0IG1vdmVtZW50WCA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRYKCkgOiAwO1xuICAgIGNvbnN0IG1vdmVtZW50WSA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRZKCkgOiAwO1xuXG4gICAgeWF3T2JqZWN0LnJvdGF0aW9uLnkgLT0gbW92ZW1lbnRYICogMC4wMDI7XG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCAtPSBtb3ZlbWVudFkgKiAwLjAwMjtcblxuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggPSBNYXRoLm1heCgtUElfMiwgTWF0aC5taW4oUElfMiwgcGl0Y2hPYmplY3Qucm90YXRpb24ueCkpO1xuICB9O1xuXG4gIGNvbnN0IHBoeXNpY3MgPSBwbGF5ZXIudXNlKCdwaHlzaWNzJyk7XG5cbiAgY29uc3Qgb25LZXlEb3duID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgY29uc29sZS5sb2coY2FuSnVtcCk7XG4gICAgICAgIGlmIChjYW5KdW1wID09PSB0cnVlKSBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IDAsIHk6IDMwMCwgejogMH0pO1xuICAgICAgICBjYW5KdW1wID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uS2V5VXAgPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gYVxuICAgICAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjI1O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXAsIGZhbHNlKTtcblxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5nZXRPYmplY3QgPSAoKSA9PiB5YXdPYmplY3Q7XG5cbiAgdGhpcy5nZXREaXJlY3Rpb24gPSB0YXJnZXRWZWMgPT4ge1xuICAgIHRhcmdldFZlYy5zZXQoMCwgMCwgLTEpO1xuICAgIHF1YXQubXVsdGlwbHlWZWN0b3IzKHRhcmdldFZlYyk7XG4gIH07XG5cbiAgLy8gTW92ZXMgdGhlIGNhbWVyYSB0byB0aGUgUGh5c2kuanMgb2JqZWN0IHBvc2l0aW9uXG4gIC8vIGFuZCBhZGRzIHZlbG9jaXR5IHRvIHRoZSBvYmplY3QgaWYgdGhlIHJ1biBrZXkgaXMgZG93bi5cbiAgY29uc3QgaW5wdXRWZWxvY2l0eSA9IG5ldyBWZWN0b3IzKCksXG4gICAgZXVsZXIgPSBuZXcgRXVsZXIoKTtcblxuICB0aGlzLnVwZGF0ZSA9IGRlbHRhID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgZGVsdGEgPSBkZWx0YSB8fCAwLjU7XG4gICAgZGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC41LCBkZWx0YSk7XG5cbiAgICBpbnB1dFZlbG9jaXR5LnNldCgwLCAwLCAwKTtcblxuICAgIGNvbnN0IHNwZWVkID0gdmVsb2NpdHlGYWN0b3IgKiBkZWx0YSAqIHBhcmFtcy5zcGVlZCAqIHJ1blZlbG9jaXR5O1xuXG4gICAgaWYgKG1vdmVGb3J3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVCYWNrd2FyZCkgaW5wdXRWZWxvY2l0eS56ID0gc3BlZWQ7XG4gICAgaWYgKG1vdmVMZWZ0KSBpbnB1dFZlbG9jaXR5LnggPSAtc3BlZWQ7XG4gICAgaWYgKG1vdmVSaWdodCkgaW5wdXRWZWxvY2l0eS54ID0gc3BlZWQ7XG5cbiAgICAvLyBDb252ZXJ0IHZlbG9jaXR5IHRvIHdvcmxkIGNvb3JkaW5hdGVzXG4gICAgZXVsZXIueCA9IHBpdGNoT2JqZWN0LnJvdGF0aW9uLng7XG4gICAgZXVsZXIueSA9IHlhd09iamVjdC5yb3RhdGlvbi55O1xuICAgIGV1bGVyLm9yZGVyID0gJ1hZWic7XG5cbiAgICBxdWF0LnNldEZyb21FdWxlcihldWxlcik7XG5cbiAgICBpbnB1dFZlbG9jaXR5LmFwcGx5UXVhdGVybmlvbihxdWF0KTtcblxuICAgIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogaW5wdXRWZWxvY2l0eS54LCB5OiAwLCB6OiBpbnB1dFZlbG9jaXR5Lnp9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJWZWxvY2l0eSh7eDogaW5wdXRWZWxvY2l0eS56LCB5OiAwLCB6OiAtaW5wdXRWZWxvY2l0eS54fSk7XG4gICAgcGh5c2ljcy5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIH07XG5cbiAgcGxheWVyLm9uKCdwaHlzaWNzOmFkZGVkJywgKCkgPT4ge1xuICAgIHBsYXllci5tYW5hZ2VyLmdldCgnbW9kdWxlOndvcmxkJykuYWRkRXZlbnRMaXN0ZW5lcigndXBkYXRlJywgKCkgPT4ge1xuICAgICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcbiAgICAgIHlhd09iamVjdC5wb3NpdGlvbi5jb3B5KHBsYXllci5wb3NpdGlvbik7XG4gICAgfSk7XG4gIH0pO1xufVxuXG5leHBvcnQgY2xhc3MgRmlyc3RQZXJzb25Nb2R1bGUge1xuICBzdGF0aWMgZGVmYXVsdHMgPSB7XG4gICAgYmxvY2s6IG51bGwsXG4gICAgc3BlZWQ6IDEsXG4gICAgeXBvczogMVxuICB9O1xuXG4gIGNvbnN0cnVjdG9yKG9iamVjdCwgcGFyYW1zID0ge30pIHtcbiAgICB0aGlzLm9iamVjdCA9IG9iamVjdDtcbiAgICB0aGlzLnBhcmFtcyA9IHBhcmFtcztcblxuICAgIGlmICghdGhpcy5wYXJhbXMuYmxvY2spIHtcbiAgICAgIHRoaXMucGFyYW1zLmJsb2NrID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ2Jsb2NrZXInKTtcbiAgICB9XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICB0aGlzLmNvbnRyb2xzID0gbmV3IEZpcnN0UGVyc29uQ29udHJvbHNTb2x2ZXIobWFuYWdlci5nZXQoJ2NhbWVyYScpLCB0aGlzLm9iamVjdCwgdGhpcy5wYXJhbXMpO1xuXG4gICAgaWYgKCdwb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnbW96UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ3dlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnQpIHtcbiAgICAgIGNvbnN0IGVsZW1lbnQgPSBkb2N1bWVudC5ib2R5O1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2NoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgaWYgKGRvY3VtZW50LnBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50Lm1velBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgIHx8IGRvY3VtZW50LndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IHRydWU7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdub25lJztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ2Jsb2NrJztcbiAgICAgICAgfVxuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tjaGFuZ2UnLCBwb2ludGVybG9ja2NoYW5nZSwgZmFsc2UpO1xuXG4gICAgICBjb25zdCBwb2ludGVybG9ja2Vycm9yID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBjb25zb2xlLndhcm4oJ1BvaW50ZXIgbG9jayBlcnJvci4nKTtcbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignd2Via2l0cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcblxuICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcignYm9keScpLmFkZEV2ZW50TGlzdGVuZXIoJ2NsaWNrJywgKCkgPT4ge1xuICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jayA9IGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RQb2ludGVyTG9jaztcblxuICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuID0gZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsU2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0RnVsbHNjcmVlbjtcblxuICAgICAgICBpZiAoL0ZpcmVmb3gvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgY29uc3QgZnVsbHNjcmVlbmNoYW5nZSA9ICgpID0+IHtcbiAgICAgICAgICAgIGlmIChkb2N1bWVudC5mdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsc2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgICB8fCBkb2N1bWVudC5tb3pGdWxsU2NyZWVuRWxlbWVudCA9PT0gZWxlbWVudCkge1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcblxuICAgICAgICAgICAgICBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH07XG5cbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21vemZ1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgICAgICBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuKCk7XG4gICAgICAgIH0gZWxzZSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9jaygpO1xuICAgICAgfSk7XG4gICAgfSBlbHNlIGNvbnNvbGUud2FybignWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlIFBvaW50ZXJMb2NrJyk7XG5cbiAgICBtYW5hZ2VyLmdldCgnc2NlbmUnKS5hZGQodGhpcy5jb250cm9scy5nZXRPYmplY3QoKSk7XG4gIH1cblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIGNvbnN0IHVwZGF0ZVByb2Nlc3NvciA9IGMgPT4ge1xuICAgICAgc2VsZi5jb250cm9scy51cGRhdGUoYy5nZXREZWx0YSgpKTtcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVMb29wID0gbmV3IExvb3AodXBkYXRlUHJvY2Vzc29yKS5zdGFydCh0aGlzKTtcbiAgfVxufVxuIiwiaW1wb3J0IHsgTG9vcCB9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcbmxldCBkaXJlY3Rpb24gPSBuZXcgVEhSRUUuVmVjdG9yMygpO1xubGV0IGltcHVsc2VfbGVuZ3RoID0gMTtcblxuZnVuY3Rpb24gc2lnbih4KSB7XG4gIHJldHVybiB0eXBlb2YgeCA9PT0gJ251bWJlcicgPyB4ID8geCA8IDAgPyAtMSA6IDEgOiB4ID09PSB4ID8gMCA6IE5hTiA6IE5hTjtcbn1cblxuZnVuY3Rpb24gcmFuZ2Vfc2NhbGUoaW5wdXQsIGluaXRfbG93LCBpbml0X2hpZ2gsIGZpbmFsX2xvdywgZmluYWxfaGlnaCkge1xuICByZXR1cm4gKGlucHV0IC0gaW5pdF9sb3cpICogKGZpbmFsX2hpZ2ggLSBmaW5hbF9sb3cpIC8gKGluaXRfaGlnaCAtIGluaXRfbG93KSArIGZpbmFsX2xvdztcbn1cblxuLy8gVE9ETzogRml4IERPTVxuZnVuY3Rpb24gVGhpcmRQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC51c2UoJ3BoeXNpY3MnKS5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMTUpO1xuICAvL2NhbWVyYS5uYXRpdmUubG9va0F0KG1lc2gpO1xuXG4gIC8qIEluaXQgKi9cbiAgY29uc3QgcGxheWVyID0gbWVzaCxcbiAgICBwaXRjaE9iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHBpdGNoT2JqZWN0LmFkZChjYW1lcmEubmF0aXZlKTtcblxuICBjb25zdCB5YXdPYmplY3QgPSBuZXcgT2JqZWN0M0QoKTtcblxuICB5YXdPYmplY3QucG9zaXRpb24ueSA9IHBhcmFtcy55cG9zOyAvLyBleWVzIGFyZSAyIG1ldGVycyBhYm92ZSB0aGUgZ3JvdW5kXG4gIHlhd09iamVjdC5hZGQocGl0Y2hPYmplY3QpO1xuXG4gIGNvbnN0IHF1YXQgPSBuZXcgUXVhdGVybmlvbigpO1xuXG4gIGxldCBjYW5KdW1wID0gZmFsc2UsXG4gICAgLy8gTW92ZXMuXG4gICAgbW92ZUZvcndhcmQgPSBmYWxzZSxcbiAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZSxcbiAgICBtb3ZlTGVmdCA9IGZhbHNlLFxuICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuXG4gIHBsYXllci5vbignY29sbGlzaW9uJywgKG90aGVyT2JqZWN0LCB2LCByLCBjb250YWN0Tm9ybWFsKSA9PiB7XG4gICAgY29uc29sZS5sb2coY29udGFjdE5vcm1hbC55KTtcbiAgICBpZiAoY29udGFjdE5vcm1hbC55IDwgMC41KSB7XG4gICAgICBjYW5KdW1wID0gdHJ1ZTtcbiAgICB9XG4gIH0pO1xuXG4gIGNvbnN0IG9uTW91c2VNb3ZlID0gZXZlbnQgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBjb25zdCBtb3ZlbWVudFggPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRYID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFggPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WCgpIDogMDtcbiAgICBjb25zdCBtb3ZlbWVudFkgPSB0eXBlb2YgZXZlbnQubW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgPyBldmVudC5tb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQubW96TW92ZW1lbnRZID09PSAnbnVtYmVyJ1xuICAgICAgICA/IGV2ZW50Lm1vek1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5nZXRNb3ZlbWVudFkgPT09ICdmdW5jdGlvbidcbiAgICAgICAgICA/IGV2ZW50LmdldE1vdmVtZW50WSgpIDogMDtcblxuICAgIHlhd09iamVjdC5yb3RhdGlvbi55IC09IG1vdmVtZW50WCAqIDAuMDAyO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggLT0gbW92ZW1lbnRZICogMC4wMDI7XG4gICAgXG4gICAgLy95YXdPYmplY3Qucm90YXRpb24ueSA9IE1hdGgubWF4KC1NYXRoLlBJLCBNYXRoLm1pbihNYXRoLlBJLCB5YXdPYmplY3Qucm90YXRpb24ueSkpO1xuICAgIHBpdGNoT2JqZWN0LnJvdGF0aW9uLnggPSBNYXRoLm1heCgtUElfMiwgTWF0aC5taW4oUElfMiwgcGl0Y2hPYmplY3Qucm90YXRpb24ueCkpO1xuICB9O1xuXG4gIGNvbnN0IHBoeXNpY3MgPSBwbGF5ZXIudXNlKCdwaHlzaWNzJyk7XG5cbiAgY29uc3Qgb25LZXlEb3duID0gZXZlbnQgPT4ge1xuICAgIHN3aXRjaCAoZXZlbnQua2V5Q29kZSkge1xuICAgICAgY2FzZSAzODogLy8gdXBcbiAgICAgIGNhc2UgODc6IC8vIHdcbiAgICAgICAgbW92ZUZvcndhcmQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBzXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM5OiAvLyByaWdodFxuICAgICAgY2FzZSA2ODogLy8gZFxuICAgICAgICBtb3ZlUmlnaHQgPSB0cnVlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzMjogLy8gc3BhY2VcbiAgICAgICAgY29uc29sZS5sb2coY2FuSnVtcCk7XG4gICAgICAgIGlmIChjYW5KdW1wID09PSB0cnVlKSBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IDAsIHk6IDMwMCwgejogMH0pO1xuICAgICAgICBjYW5KdW1wID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuNTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgfVxuICB9O1xuXG4gIGNvbnN0IG9uS2V5VXAgPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzNzogLy8gbGVmdFxuICAgICAgY2FzZSA2NTogLy8gYVxuICAgICAgICBtb3ZlTGVmdCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSA0MDogLy8gZG93blxuICAgICAgY2FzZSA4MzogLy8gYVxuICAgICAgICBtb3ZlQmFja3dhcmQgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAxNjogLy8gc2hpZnRcbiAgICAgICAgcnVuVmVsb2NpdHkgPSAwLjI1O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdtb3VzZW1vdmUnLCBvbk1vdXNlTW92ZSwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleWRvd24nLCBvbktleURvd24sIGZhbHNlKTtcbiAgZG9jdW1lbnQuYm9keS5hZGRFdmVudExpc3RlbmVyKCdrZXl1cCcsIG9uS2V5VXAsIGZhbHNlKTtcblxuICB0aGlzLmVuYWJsZWQgPSBmYWxzZTtcbiAgdGhpcy5nZXRPYmplY3QgPSAoKSA9PiB5YXdPYmplY3Q7XG5cbiAgdGhpcy5nZXREaXJlY3Rpb24gPSB0YXJnZXRWZWMgPT4ge1xuICAgIHRhcmdldFZlYy5zZXQoMCwgMCwgLTEpO1xuICAgIHF1YXQubXVsdGlwbHlWZWN0b3IzKHRhcmdldFZlYyk7XG4gIH07XG5cbiAgLy8gTW92ZXMgdGhlIGNhbWVyYSB0byB0aGUgUGh5c2kuanMgb2JqZWN0IHBvc2l0aW9uXG4gIC8vIGFuZCBhZGRzIHZlbG9jaXR5IHRvIHRoZSBvYmplY3QgaWYgdGhlIHJ1biBrZXkgaXMgZG93bi5cbiAgY29uc3QgaW5wdXRWZWxvY2l0eSA9IG5ldyBWZWN0b3IzKCksXG4gICAgZXVsZXIgPSBuZXcgRXVsZXIoKTtcblxuICB0aGlzLnVwZGF0ZSA9IGRlbHRhID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgZGVsdGEgPSBkZWx0YSB8fCAwLjU7XG4gICAgZGVsdGEgPSBNYXRoLm1pbihkZWx0YSwgMC41LCBkZWx0YSk7XG5cbiAgICBpbnB1dFZlbG9jaXR5LnNldCgwLCAwLCAwKTtcblxuICAgIGRpcmVjdGlvbiA9IGNhbWVyYS5uYXRpdmUuZ2V0V29ybGREaXJlY3Rpb24oIGRpcmVjdGlvbiApO1xuICAgIGxldCBhbmdsZSA9IFRIUkVFLk1hdGgucmFkVG9EZWcoIE1hdGguYXRhbihkaXJlY3Rpb24ueSkgKVxuICAgIGFuZ2xlID0gcmFuZ2Vfc2NhbGUoYW5nbGUsIC00NSwgNDUsIC05MCwgOTApXG4gICAgbGV0IHJhZGlhbnMgPSBUSFJFRS5NYXRoLmRlZ1RvUmFkKGFuZ2xlKVxuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG4gICAgZGlyZWN0aW9uLm5vcm1hbGl6ZSgpXG5cbiAgICBpZiAoIG1vdmVGb3J3YXJkIHx8IG1vdmVCYWNrd2FyZCApIHtcbiAgICAgIGxldCBkdCA9IG1vdmVGb3J3YXJkID8gLTEgOiAxXG4gICAgICBpbnB1dFZlbG9jaXR5LnkgPSAtZHQgKiBzcGVlZCAqIE1hdGguc2luKHJhZGlhbnMpICogaW1wdWxzZV9sZW5ndGg7XG4gICAgICBpbnB1dFZlbG9jaXR5LnogPSBkdCAqIHNwZWVkICogTWF0aC5jb3MocmFkaWFucykgKiBpbXB1bHNlX2xlbmd0aDtcbiAgICB9XG5cbiAgICBpZiAobW92ZUxlZnQgfHwgbW92ZVJpZ2h0KSB7XG4gICAgICBsZXQgZHQgPSBtb3ZlTGVmdCA/IC0xIDogMVxuICAgICAgaW5wdXRWZWxvY2l0eS54ID0gZHQgKiBzcGVlZCAqIGltcHVsc2VfbGVuZ3RoO1xuICAgIH1cblxuICAgIFxuICAgIGlmKGlucHV0VmVsb2NpdHkueCB8fCBpbnB1dFZlbG9jaXR5LnkgfHwgaW5wdXRWZWxvY2l0eS56KSB7XG4gICAgICBpbnB1dFZlbG9jaXR5LmFwcGx5UXVhdGVybmlvbih5YXdPYmplY3QucXVhdGVybmlvbik7XG4gICAgICBwaHlzaWNzLmFwcGx5Q2VudHJhbEltcHVsc2Uoe3g6IGlucHV0VmVsb2NpdHkueCwgeTogaW5wdXRWZWxvY2l0eS55LCB6OiBpbnB1dFZlbG9jaXR5Lnp9KTtcbiAgICB9XG4gIH07XG5cbiAgcGxheWVyLm9uKCdwaHlzaWNzOmFkZGVkJywgKCkgPT4ge1xuICAgIHBsYXllci51c2UoXCJwaHlzaWNzXCIpLnNldERhbXBpbmcoLjYsIDApXG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBUaGlyZFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgVGhpcmRQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2snKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iXSwibmFtZXMiOlsiTUVTU0FHRV9UWVBFUyIsIlJFUE9SVF9JVEVNU0laRSIsIkNPTExJU0lPTlJFUE9SVF9JVEVNU0laRSIsIlZFSElDTEVSRVBPUlRfSVRFTVNJWkUiLCJDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIiwidGVtcDFWZWN0b3IzIiwiVmVjdG9yMyIsInRlbXAyVmVjdG9yMyIsInRlbXAxTWF0cml4NCIsIk1hdHJpeDQiLCJ0ZW1wMVF1YXQiLCJRdWF0ZXJuaW9uIiwiZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiIsIngiLCJ5IiwieiIsInciLCJNYXRoIiwiYXRhbjIiLCJhc2luIiwiZ2V0UXVhdGVydGlvbkZyb21FdWxlciIsImMxIiwiY29zIiwiczEiLCJzaW4iLCJjMiIsInMyIiwiYzMiLCJzMyIsImMxYzIiLCJzMXMyIiwiY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCIsInBvc2l0aW9uIiwib2JqZWN0IiwiaWRlbnRpdHkiLCJtYWtlUm90YXRpb25Gcm9tUXVhdGVybmlvbiIsInF1YXRlcm5pb24iLCJnZXRJbnZlcnNlIiwiY29weSIsInN1YiIsImFwcGx5TWF0cml4NCIsImFkZE9iamVjdENoaWxkcmVuIiwicGFyZW50IiwiaSIsImNoaWxkcmVuIiwibGVuZ3RoIiwiY2hpbGQiLCJwaHlzaWNzIiwiY29tcG9uZW50IiwidXNlIiwiZGF0YSIsInVwZGF0ZU1hdHJpeCIsInVwZGF0ZU1hdHJpeFdvcmxkIiwic2V0RnJvbU1hdHJpeFBvc2l0aW9uIiwibWF0cml4V29ybGQiLCJzZXRGcm9tUm90YXRpb25NYXRyaXgiLCJwb3NpdGlvbl9vZmZzZXQiLCJyb3RhdGlvbiIsInB1c2giLCJFdmVudGFibGUiLCJfZXZlbnRMaXN0ZW5lcnMiLCJldmVudF9uYW1lIiwiY2FsbGJhY2siLCJoYXNPd25Qcm9wZXJ0eSIsImluZGV4IiwiaW5kZXhPZiIsInNwbGljZSIsInBhcmFtZXRlcnMiLCJBcnJheSIsInByb3RvdHlwZSIsImNhbGwiLCJhcmd1bWVudHMiLCJhcHBseSIsIm9iaiIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZGlzcGF0Y2hFdmVudCIsIkNvbmVUd2lzdENvbnN0cmFpbnQiLCJvYmphIiwib2JqYiIsIm9iamVjdGEiLCJvYmplY3RiIiwidW5kZWZpbmVkIiwiY29uc29sZSIsImVycm9yIiwidHlwZSIsImFwcGxpZWRJbXB1bHNlIiwid29ybGRNb2R1bGUiLCJpZCIsInBvc2l0aW9uYSIsImNsb25lIiwicG9zaXRpb25iIiwiYXhpc2EiLCJheGlzYiIsImV4ZWN1dGUiLCJjb25zdHJhaW50IiwibWF4X2ltcHVsc2UiLCJ0YXJnZXQiLCJzZXRGcm9tRXVsZXIiLCJFdWxlciIsIkhpbmdlQ29uc3RyYWludCIsImF4aXMiLCJsb3ciLCJoaWdoIiwiYmlhc19mYWN0b3IiLCJyZWxheGF0aW9uX2ZhY3RvciIsInZlbG9jaXR5IiwiYWNjZWxlcmF0aW9uIiwiUG9pbnRDb25zdHJhaW50IiwiU2xpZGVyQ29uc3RyYWludCIsImxpbl9sb3dlciIsImxpbl91cHBlciIsImFuZ19sb3dlciIsImFuZ191cHBlciIsImxpbmVhciIsImFuZ3VsYXIiLCJzY2VuZSIsIkRPRkNvbnN0cmFpbnQiLCJsaW1pdCIsIndoaWNoIiwibG93X2FuZ2xlIiwiaGlnaF9hbmdsZSIsIm1heF9mb3JjZSIsIlZlaGljbGUiLCJtZXNoIiwidHVuaW5nIiwiVmVoaWNsZVR1bmluZyIsIndoZWVscyIsIl9waHlzaWpzIiwiZ2V0T2JqZWN0SWQiLCJzdXNwZW5zaW9uX3N0aWZmbmVzcyIsInN1c3BlbnNpb25fY29tcHJlc3Npb24iLCJzdXNwZW5zaW9uX2RhbXBpbmciLCJtYXhfc3VzcGVuc2lvbl90cmF2ZWwiLCJmcmljdGlvbl9zbGlwIiwibWF4X3N1c3BlbnNpb25fZm9yY2UiLCJ3aGVlbF9nZW9tZXRyeSIsIndoZWVsX21hdGVyaWFsIiwiY29ubmVjdGlvbl9wb2ludCIsIndoZWVsX2RpcmVjdGlvbiIsIndoZWVsX2F4bGUiLCJzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoIiwid2hlZWxfcmFkaXVzIiwiaXNfZnJvbnRfd2hlZWwiLCJ3aGVlbCIsIk1lc2giLCJjYXN0U2hhZG93IiwicmVjZWl2ZVNoYWRvdyIsIm11bHRpcGx5U2NhbGFyIiwiYWRkIiwid29ybGQiLCJhbW91bnQiLCJzdGVlcmluZyIsImJyYWtlIiwiZm9yY2UiLCJXb3JsZE1vZHVsZUJhc2UiLCJvcHRpb25zIiwiYnJpZGdlIiwic2VsZiIsImRlZmVyIiwib25BZGRDYWxsYmFjayIsImJpbmQiLCJvblJlbW92ZUNhbGxiYWNrIiwiT2JqZWN0IiwiYXNzaWduIiwiZGVmYXVsdHMiLCJvYmplY3RzIiwidmVoaWNsZXMiLCJjb25zdHJhaW50cyIsImlzU2ltdWxhdGluZyIsInJlY2VpdmUiLCJfdGVtcCIsImV2ZW50IiwiQXJyYXlCdWZmZXIiLCJieXRlTGVuZ3RoIiwiRmxvYXQzMkFycmF5IiwiV09STERSRVBPUlQiLCJ1cGRhdGVTY2VuZSIsIlNPRlRSRVBPUlQiLCJ1cGRhdGVTb2Z0Ym9kaWVzIiwiQ09MTElTSU9OUkVQT1JUIiwidXBkYXRlQ29sbGlzaW9ucyIsIlZFSElDTEVSRVBPUlQiLCJ1cGRhdGVWZWhpY2xlcyIsIkNPTlNUUkFJTlRSRVBPUlQiLCJ1cGRhdGVDb25zdHJhaW50cyIsImNtZCIsInBhcmFtcyIsInRlc3QiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJvZmZzZXQiLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwic2VuZCIsImJ1ZmZlciIsInNpemUiLCJhdHRyaWJ1dGVzIiwiZ2VvbWV0cnkiLCJ2b2x1bWVQb3NpdGlvbnMiLCJhcnJheSIsIm9mZnNldFZlcnQiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwibm9ybWFsIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJ2ZWhpY2xlIiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJqIiwidG91Y2hlcyIsImlkMiIsImNvbXBvbmVudDIiLCJkYXRhMiIsInZlbCIsImdldExpbmVhclZlbG9jaXR5IiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsIndpZHRoIiwic2NhbGUiLCJoZWlnaHQiLCJkZXB0aCIsInJlbW92ZSIsInBvcCIsImZ1bmMiLCJhcmdzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpc0xvYWRlZCIsImxvYWRlciIsInRoZW4iLCJkZWZpbmUiLCJ3b3JrZXIiLCJzZXRGaXhlZFRpbWVTdGVwIiwiZml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJncmF2aXR5IiwiYWRkQ29uc3RyYWludCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwicG9zIiwiaXNTb2Z0Ym9keSIsInF1YXQiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsInN0YXJ0IiwibG9nIiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIndpbmRvdyIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwibSIsIm9ubWVzc2FnZSIsInBvc3RNZXNzYWdlIiwiaXNUaGlzVGhyZWFkIiwidGVzdFdvcmtlciIsInRlc3RBcnJheSIsIlVpbnQ4QXJyYXkiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCJFcnJvciIsImUiLCJ0ZXJtaW5hdGUiLCJzdHIiLCJjcmVhdGVPYmplY3RVUkwiLCJCbG9iIiwiYmxvYiIsImFwcGVuZCIsImdldEJsb2IiLCJkb2N1bWVudCIsIkV2ZW50cyIsImV2ZW50cyIsImVtcHR5Iiwib24iLCJjdHgiLCJvZmYiLCJsaXN0IiwiaW5zaWRlV29ya2VyIiwid2Via2l0UG9zdE1lc3NhZ2UiLCJhYiIsIl9vYmplY3QiLCJfdmVjdG9yIiwiX3RyYW5zZm9ybSIsIl90cmFuc2Zvcm1fcG9zIiwiX3NvZnRib2R5X2VuYWJsZWQiLCJsYXN0X3NpbXVsYXRpb25fZHVyYXRpb24iLCJfbnVtX29iamVjdHMiLCJfbnVtX3JpZ2lkYm9keV9vYmplY3RzIiwiX251bV9zb2Z0Ym9keV9vYmplY3RzIiwiX251bV93aGVlbHMiLCJfbnVtX2NvbnN0cmFpbnRzIiwiX3NvZnRib2R5X3JlcG9ydF9zaXplIiwiX3ZlYzNfMSIsIl92ZWMzXzIiLCJfdmVjM18zIiwiX3F1YXQiLCJwdWJsaWNfZnVuY3Rpb25zIiwiX29iamVjdHMiLCJfdmVoaWNsZXMiLCJfY29uc3RyYWludHMiLCJfb2JqZWN0c19hbW1vIiwiX29iamVjdF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwic29mdHJlcG9ydCIsImNvbGxpc2lvbnJlcG9ydCIsInZlaGljbGVyZXBvcnQiLCJjb25zdHJhaW50cmVwb3J0IiwiV09STERSRVBPUlRfSVRFTVNJWkUiLCJnZXRTaGFwZUZyb21DYWNoZSIsImNhY2hlX2tleSIsInNldFNoYXBlQ2FjaGUiLCJzaGFwZSIsImNyZWF0ZVNoYXBlIiwiZGVzY3JpcHRpb24iLCJzZXRJZGVudGl0eSIsIkFtbW8iLCJidENvbXBvdW5kU2hhcGUiLCJzZXRYIiwic2V0WSIsInNldFoiLCJidFN0YXRpY1BsYW5lU2hhcGUiLCJidEJveFNoYXBlIiwicmFkaXVzIiwiYnRTcGhlcmVTaGFwZSIsImJ0Q3lsaW5kZXJTaGFwZSIsImJ0Q2Fwc3VsZVNoYXBlIiwiYnRDb25lU2hhcGUiLCJ0cmlhbmdsZV9tZXNoIiwiYnRUcmlhbmdsZU1lc2giLCJhZGRUcmlhbmdsZSIsImJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUiLCJidENvbnZleEh1bGxTaGFwZSIsImFkZFBvaW50IiwieHB0cyIsInlwdHMiLCJwb2ludHMiLCJwdHIiLCJfbWFsbG9jIiwicCIsInAyIiwiSEVBUEYzMiIsImJ0SGVpZ2h0ZmllbGRUZXJyYWluU2hhcGUiLCJhYnNNYXhIZWlnaHQiLCJjcmVhdGVTb2Z0Qm9keSIsImJvZHkiLCJzb2Z0Qm9keUhlbHBlcnMiLCJidFNvZnRCb2R5SGVscGVycyIsImFWZXJ0aWNlcyIsIkNyZWF0ZUZyb21UcmlNZXNoIiwiZ2V0V29ybGRJbmZvIiwiYUluZGljZXMiLCJjciIsImNvcm5lcnMiLCJDcmVhdGVQYXRjaCIsImJ0VmVjdG9yMyIsInNlZ21lbnRzIiwiQ3JlYXRlUm9wZSIsImluaXQiLCJub1dvcmtlciIsImFtbW8iLCJtYWtlV29ybGQiLCJ3YXNtQnVmZmVyIiwibG9hZEFtbW9Gcm9tQmluYXJ5IiwiYnRUcmFuc2Zvcm0iLCJidFF1YXRlcm5pb24iLCJyZXBvcnRzaXplIiwiY29sbGlzaW9uQ29uZmlndXJhdGlvbiIsInNvZnRib2R5IiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJhcHBlbmRBbmNob3IiLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJsaW5rTm9kZXMiLCJzZWxmX2JvZHkiLCJvdGhlcl9ib2R5Iiwic2VsZl9ub2RlIiwiZ2V0X21fbm9kZXMiLCJhdCIsIm4xIiwib3RoZXJfbm9kZSIsIm4yIiwic2VsZl92ZWMiLCJnZXRfbV94Iiwib3RoZXJfdmVjIiwiZm9yY2VfeCIsImZvcmNlX3kiLCJmb3JjZV96IiwiY2FjaGVkX2Rpc3RhbmNlIiwibGlua2VkIiwiX2xvb3AiLCJzZXRJbnRlcnZhbCIsImRpc3RhbmNlIiwic3FydCIsInNldFZlbG9jaXR5IiwibW9kaWZlcjIiLCJtYXgiLCJtb2RpZmllciIsImFkZFZlbG9jaXR5IiwiYXBwZW5kTGluayIsImFkZEZvcmNlIiwiYXBwZW5kTGluZWFySm9pbnQiLCJzcGVjcyIsIlNwZWNzIiwiX3BvcyIsInNldF9wb3NpdGlvbiIsImVycCIsInNldF9lcnAiLCJjZm0iLCJzZXRfY2ZtIiwic3BsaXQiLCJzZXRfc3BsaXQiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwic2V0X21fa0xTVCIsImthc3QiLCJzZXRfbV9rQVNUIiwia3ZzdCIsInNldF9tX2tWU1QiLCJjYXN0T2JqZWN0IiwiYnRDb2xsaXNpb25PYmplY3QiLCJnZXRDb2xsaXNpb25TaGFwZSIsInNldE1hcmdpbiIsIm1hcmdpbiIsInNldEFjdGl2YXRpb25TdGF0ZSIsInN0YXRlIiwicm9wZSIsImNsb3RoIiwic2V0VyIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJzZXRPcmlnaW4iLCJzZXRSb3RhdGlvbiIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJidFJheWNhc3RWZWhpY2xlIiwicmlnaWRCb2R5IiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJfbW90aW9uX3N0YXRlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsInVwZGF0ZVRyYW5zZm9ybSIsImdldE1vdGlvblN0YXRlIiwiZ2V0V29ybGRUcmFuc2Zvcm0iLCJzZXRXb3JsZFRyYW5zZm9ybSIsInRyYW5zZm9ybSIsInVwZGF0ZU1hc3MiLCJzZXRNYXNzUHJvcHMiLCJhcHBseUNlbnRyYWxJbXB1bHNlIiwiYXBwbHlJbXB1bHNlIiwiaW1wdWxzZV94IiwiaW1wdWxzZV95IiwiaW1wdWxzZV96IiwiYXBwbHlUb3JxdWUiLCJ0b3JxdWVfeCIsInRvcnF1ZV95IiwidG9ycXVlX3oiLCJhcHBseUNlbnRyYWxGb3JjZSIsImFwcGx5Rm9yY2UiLCJvblNpbXVsYXRpb25SZXN1bWUiLCJsYXN0X3NpbXVsYXRpb25fdGltZSIsInNldEFuZ3VsYXJWZWxvY2l0eSIsInNldExpbmVhclZlbG9jaXR5Iiwic2V0QW5ndWxhckZhY3RvciIsInNldExpbmVhckZhY3RvciIsInNldERhbXBpbmciLCJzZXRDY2RNb3Rpb25UaHJlc2hvbGQiLCJ0aHJlc2hvbGQiLCJzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cyIsImJ0UG9pbnQyUG9pbnRDb25zdHJhaW50IiwiYnRIaW5nZUNvbnN0cmFpbnQiLCJ0cmFuc2Zvcm1iIiwidHJhbnNmb3JtYSIsImdldFJvdGF0aW9uIiwic2V0RXVsZXIiLCJidFNsaWRlckNvbnN0cmFpbnQiLCJ0YSIsInRiIiwic2V0RXVsZXJaWVgiLCJidENvbmVUd2lzdENvbnN0cmFpbnQiLCJzZXRMaW1pdCIsIlBJIiwiYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQiLCJiIiwiZW5hYmxlRmVlZGJhY2siLCJyZW1vdmVDb25zdHJhaW50IiwiY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJzZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQiLCJjZWlsIiwic3RlcFNpbXVsYXRpb24iLCJyZXBvcnRWZWhpY2xlcyIsInJlcG9ydENvbnN0cmFpbnRzIiwicmVwb3J0V29ybGRfc29mdGJvZGllcyIsImhpbmdlX3NldExpbWl0cyIsImhpbmdlX2VuYWJsZUFuZ3VsYXJNb3RvciIsImVuYWJsZUFuZ3VsYXJNb3RvciIsImhpbmdlX2Rpc2FibGVNb3RvciIsImVuYWJsZU1vdG9yIiwic2xpZGVyX3NldExpbWl0cyIsInNldExvd2VyTGluTGltaXQiLCJzZXRVcHBlckxpbkxpbWl0Iiwic2V0TG93ZXJBbmdMaW1pdCIsInNldFVwcGVyQW5nTGltaXQiLCJzbGlkZXJfc2V0UmVzdGl0dXRpb24iLCJzZXRTb2Z0bmVzc0xpbUxpbiIsInNldFNvZnRuZXNzTGltQW5nIiwic2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yIiwic2V0VGFyZ2V0TGluTW90b3JWZWxvY2l0eSIsInNldE1heExpbk1vdG9yRm9yY2UiLCJzZXRQb3dlcmVkTGluTW90b3IiLCJzbGlkZXJfZGlzYWJsZUxpbmVhck1vdG9yIiwic2xpZGVyX2VuYWJsZUFuZ3VsYXJNb3RvciIsInNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkiLCJzZXRNYXhBbmdNb3RvckZvcmNlIiwic2V0UG93ZXJlZEFuZ01vdG9yIiwic2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJjb25ldHdpc3Rfc2V0TGltaXQiLCJjb25ldHdpc3RfZW5hYmxlTW90b3IiLCJjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlIiwic2V0TWF4TW90b3JJbXB1bHNlIiwiY29uZXR3aXN0X3NldE1vdG9yVGFyZ2V0Iiwic2V0TW90b3JUYXJnZXQiLCJjb25ldHdpc3RfZGlzYWJsZU1vdG9yIiwiZG9mX3NldExpbmVhckxvd2VyTGltaXQiLCJzZXRMaW5lYXJMb3dlckxpbWl0IiwiZG9mX3NldExpbmVhclVwcGVyTGltaXQiLCJzZXRMaW5lYXJVcHBlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0Iiwic2V0QW5ndWxhckxvd2VyTGltaXQiLCJkb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQiLCJzZXRBbmd1bGFyVXBwZXJMaW1pdCIsImRvZl9lbmFibGVBbmd1bGFyTW90b3IiLCJtb3RvciIsImdldFJvdGF0aW9uYWxMaW1pdE1vdG9yIiwic2V0X21fZW5hYmxlTW90b3IiLCJkb2ZfY29uZmlndXJlQW5ndWxhck1vdG9yIiwic2V0X21fbG9MaW1pdCIsInNldF9tX2hpTGltaXQiLCJzZXRfbV90YXJnZXRWZWxvY2l0eSIsInNldF9tX21heE1vdG9yRm9yY2UiLCJkb2ZfZGlzYWJsZUFuZ3VsYXJNb3RvciIsInJlcG9ydFdvcmxkIiwid29ybGRyZXBvcnQiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJub2RlcyIsInZlcnQiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwicmVwb3J0Q29sbGlzaW9ucyIsImRwIiwiZ2V0RGlzcGF0Y2hlciIsIm51bSIsImdldE51bU1hbmlmb2xkcyIsIm1hbmlmb2xkIiwiZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwiLCJudW1fY29udGFjdHMiLCJnZXROdW1Db250YWN0cyIsInB0IiwiZ2V0Q29udGFjdFBvaW50IiwiZ2V0Qm9keTAiLCJnZXRCb2R5MSIsImdldF9tX25vcm1hbFdvcmxkT25CIiwiZ2V0TnVtV2hlZWxzIiwiZ2V0V2hlZWxJbmZvIiwiZ2V0X21fd29ybGRUcmFuc2Zvcm0iLCJsZW5naHQiLCJvZmZzZXRfYm9keSIsImdldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZCIsIldvcmxkTW9kdWxlIiwiUGh5c2ljc1dvcmtlciIsInRyYW5zZmVyYWJsZU1lc3NhZ2UiLCJyZWplY3QiLCJzZXR1cCIsInByb3BlcnRpZXMiLCJfbmF0aXZlIiwidmVjdG9yMyIsInNjb3BlIiwiZGVmaW5lUHJvcGVydGllcyIsIl94IiwiX3kiLCJfeiIsIl9fY19yb3QiLCJvbkNoYW5nZSIsImV1bGVyIiwicm90Iiwid3JhcFBoeXNpY3NQcm90b3R5cGUiLCJrZXkiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIm9uQ29weSIsInNvdXJjZVBoeXNpY3MiLCJtb2R1bGVzIiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiaGFzIiwibW9kdWxlIiwicmVzdWx0IiwiY29uc3RydWN0b3IiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsImdlb21ldHJ5UHJvY2Vzc29yIiwiaXNCdWZmZXJHZW9tZXRyeSIsInZlcnRpY2VzIiwidkEiLCJ2QiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJWZWN0b3IyIiwieGRpdiIsInlkaXYiLCJ2ZXJ0cyIsInhzaXplIiwieXNpemUiLCJhYnMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsImF1dG9BbGlnbiIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibzEiLCJvMiIsImFycmF5TWF4IiwiSW5maW5pdHkiLCJsIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwidXZzIiwiZmFjZVZlcnRleFV2cyIsIm5vcm1hbHNBcnJheSIsInV2c0FycmF5IiwiZmFjZUFycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlQmFja3dhcmQiLCJtb3ZlTGVmdCIsIm1vdmVSaWdodCIsIm90aGVyT2JqZWN0IiwidiIsInIiLCJjb250YWN0Tm9ybWFsIiwib25Nb3VzZU1vdmUiLCJlbmFibGVkIiwibW92ZW1lbnRYIiwibW96TW92ZW1lbnRYIiwiZ2V0TW92ZW1lbnRYIiwibW92ZW1lbnRZIiwibW96TW92ZW1lbnRZIiwiZ2V0TW92ZW1lbnRZIiwib25LZXlEb3duIiwia2V5Q29kZSIsIm9uS2V5VXAiLCJnZXRPYmplY3QiLCJnZXREaXJlY3Rpb24iLCJtdWx0aXBseVZlY3RvcjMiLCJ0YXJnZXRWZWMiLCJpbnB1dFZlbG9jaXR5IiwiZGVsdGEiLCJzcGVlZCIsIm1vdmVGb3J3YXJkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiLCJkaXJlY3Rpb24iLCJUSFJFRSIsImltcHVsc2VfbGVuZ3RoIiwicmFuZ2Vfc2NhbGUiLCJpbnB1dCIsImluaXRfbG93IiwiaW5pdF9oaWdoIiwiZmluYWxfbG93IiwiZmluYWxfaGlnaCIsIlRoaXJkUGVyc29uQ29udHJvbHNTb2x2ZXIiLCJnZXRXb3JsZERpcmVjdGlvbiIsImFuZ2xlIiwicmFkVG9EZWciLCJhdGFuIiwicmFkaWFucyIsImRlZ1RvUmFkIiwibm9ybWFsaXplIiwiZHQiLCJUaGlyZFBlcnNvbk1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7O0lBTU1BLGdCQUFnQjtlQUNQLENBRE87bUJBRUgsQ0FGRztpQkFHTCxDQUhLO29CQUlGLENBSkU7Y0FLUjtDQUxkOztBQVFBLElBQU1DLGtCQUFrQixFQUF4QjtJQUNFQywyQkFBMkIsQ0FEN0I7SUFFRUMseUJBQXlCLENBRjNCO0lBR0VDLDRCQUE0QixDQUg5Qjs7QUFLQSxJQUFNQyxlQUFlLElBQUlDLFNBQUosRUFBckI7SUFDRUMsZUFBZSxJQUFJRCxTQUFKLEVBRGpCO0lBRUVFLGVBQWUsSUFBSUMsT0FBSixFQUZqQjtJQUdFQyxZQUFZLElBQUlDLFVBQUosRUFIZDs7QUFLQSxJQUFNQyw0QkFBNEIsU0FBNUJBLHlCQUE0QixDQUFDQyxDQUFELEVBQUlDLENBQUosRUFBT0MsQ0FBUCxFQUFVQyxDQUFWLEVBQWdCO1NBQ3pDLElBQUlWLFNBQUosQ0FDTFcsS0FBS0MsS0FBTCxDQUFXLEtBQUtMLElBQUlHLENBQUosR0FBUUYsSUFBSUMsQ0FBakIsQ0FBWCxFQUFpQ0MsSUFBSUEsQ0FBSixHQUFRSCxJQUFJQSxDQUFaLEdBQWdCQyxJQUFJQSxDQUFwQixHQUF3QkMsSUFBSUEsQ0FBN0QsQ0FESyxFQUVMRSxLQUFLRSxJQUFMLENBQVUsS0FBS04sSUFBSUUsQ0FBSixHQUFRRCxJQUFJRSxDQUFqQixDQUFWLENBRkssRUFHTEMsS0FBS0MsS0FBTCxDQUFXLEtBQUtILElBQUlDLENBQUosR0FBUUgsSUFBSUMsQ0FBakIsQ0FBWCxFQUFpQ0UsSUFBSUEsQ0FBSixH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
