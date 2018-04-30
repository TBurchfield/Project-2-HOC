(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('three'), require('whs')) :
  typeof define === 'function' && define.amd ? define(['exports', 'three', 'whs'], factory) :
  (factory((global.MyLibrary = {}),global.three,global.whs));
}(this, (function (exports,three,whs) { 'use strict';

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

  var temp1Vector3 = new three.Vector3(),
      temp2Vector3 = new three.Vector3(),
      temp1Matrix4 = new three.Matrix4(),
      temp1Quat = new three.Quaternion();

  var getEulerXYZFromQuaternion = function getEulerXYZFromQuaternion(x, y, z, w) {
    return new three.Vector3(Math.atan2(2 * (x * w - y * z), w * w - x * x - y * y + z * z), Math.asin(2 * (x * z + y * w)), Math.atan2(2 * (z * w - x * y), w * w + x * x - y * y - z * z));
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
        if (target instanceof three.Vector3) target = new three.Quaternion().setFromEuler(new three.Euler(target.x, target.y, target.z));else if (target instanceof three.Euler) target = new three.Quaternion().setFromEuler(target);else if (target instanceof three.Matrix4) target = new three.Quaternion().setFromRotationMatrix(target);

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
        var wheel = new three.Mesh(wheel_geometry, wheel_material);

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
              marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

              marker.position.copy(constraint.positiona);
              this.objects[constraint.objecta].add(marker);
              break;

            case 'hinge':
              marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

              marker.position.copy(constraint.positiona);
              this.objects[constraint.objecta].add(marker);
              break;

            case 'slider':
              marker = new three.Mesh(new three.BoxGeometry(10, 1, 1), new three.MeshNormalMaterial());

              marker.position.copy(constraint.positiona);

              // This rotation isn't right if all three axis are non-0 values
              // TODO: change marker's rotation order to ZYX
              marker.rotation.set(constraint.axis.y, // yes, y and
              constraint.axis.x, // x axis are swapped
              constraint.axis.z);
              this.objects[constraint.objecta].add(marker);
              break;

            case 'conetwist':
              marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

              marker.position.copy(constraint.positiona);
              this.objects[constraint.objecta].add(marker);
              break;

            case 'dof':
              marker = new three.Mesh(new three.SphereGeometry(1.5), new three.MeshNormalMaterial());

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
          self.simulateLoop = new whs.Loop(function (clock) {
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
    gravity: new three.Vector3(0, 100, 0)
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

        this.quaternion.copy(new three.Quaternion().setFromEuler(euler));

        rot.onChange(function () {
          if (_this2.__c_rot) {
            _this2.quaternion.copy(new three.Quaternion().setFromEuler(rot));
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
      linearVelocity: new three.Vector3(),
      angularVelocity: new three.Vector3(),
      mass: 10,
      scale: new three.Vector3(1, 1, 1),
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
      scale: new three.Vector3(1, 1, 1),
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
      scale: new three.Vector3(1, 1, 1),
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
      scale: new three.Vector3(1, 1, 1),
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
        if (!geometry.isBufferGeometry) geometry._bufferGeometry = new three.BufferGeometry().fromGeometry(geometry);

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
        size: new three.Vector2(1, 1),
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

        data.scale.multiply(new three.Vector3(xsize / (xpts - 1), 1, ysize / (ypts - 1)));

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

          var bufferGeometry = new three.BufferGeometry();

          bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

          bufferGeometry.setIndex(new three.BufferAttribute(new (geometry.faces.length * 3 > 65535 ? Uint32Array : Uint16Array)(geometry.faces.length * 3), 1).copyIndicesArray(geometry.faces));

          return bufferGeometry;
        }();

        data.aVertices = idxGeometry.attributes.position.array;
        data.aIndices = idxGeometry.index.array;

        return new three.BufferGeometry().fromGeometry(geometry);
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

          var bufferGeometry = new three.BufferGeometry();

          bufferGeometry.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

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

          bufferGeometry.addAttribute('normal', new three.BufferAttribute(normalsArray, 3));

          bufferGeometry.addAttribute('uv', new three.BufferAttribute(uvsArray, 2));

          bufferGeometry.setIndex(new three.BufferAttribute(new (arrayMax(faces) * 3 > 65535 ? Uint32Array : Uint16Array)(facesLength * 3), 1).copyIndicesArray(faces));

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
            var buff = new three.BufferGeometry();

            buff.addAttribute('position', new three.BufferAttribute(new Float32Array(geometry.vertices.length * 3), 3).copyVector3sArray(geometry.vertices));

            return buff;
          }();
        }

        var length = geometry.attributes.position.array.length / 3;
        var vert = function vert(n) {
          return new three.Vector3().fromArray(geometry.attributes.position.array, n * 3);
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
        pitchObject = new three.Object3D();

    pitchObject.add(camera.native);

    var yawObject = new three.Object3D();

    yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
    yawObject.add(pitchObject);

    var quat = new three.Quaternion();

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
    var inputVelocity = new three.Vector3(),
        euler = new three.Euler();

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

        self.updateLoop = new whs.Loop(updateProcessor).start(this);
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
        pitchObject = new three.Object3D();

    pitchObject.add(camera.native);

    var yawObject = new three.Object3D();

    yawObject.position.y = params.ypos; // eyes are 2 meters above the ground
    yawObject.add(pitchObject);

    var quat = new three.Quaternion();

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
    var inputVelocity = new three.Vector3(),
        euler = new three.Euler();

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

        self.updateLoop = new whs.Loop(updateProcessor).start(this);
      }
    }]);
    return ThirdPersonModule;
  }(), _class$3.defaults = {
    block: null,
    speed: 1,
    ypos: 1
  }, _temp$2);

  exports.getEulerXYZFromQuaternion = getEulerXYZFromQuaternion;
  exports.getQuatertionFromEuler = getQuatertionFromEuler;
  exports.convertWorldPositionToObject = convertWorldPositionToObject;
  exports.addObjectChildren = addObjectChildren;
  exports.MESSAGE_TYPES = MESSAGE_TYPES;
  exports.REPORT_ITEMSIZE = REPORT_ITEMSIZE;
  exports.COLLISIONREPORT_ITEMSIZE = COLLISIONREPORT_ITEMSIZE;
  exports.VEHICLEREPORT_ITEMSIZE = VEHICLEREPORT_ITEMSIZE;
  exports.CONSTRAINTREPORT_ITEMSIZE = CONSTRAINTREPORT_ITEMSIZE;
  exports.temp1Vector3 = temp1Vector3;
  exports.temp2Vector3 = temp2Vector3;
  exports.temp1Matrix4 = temp1Matrix4;
  exports.temp1Quat = temp1Quat;
  exports.Eventable = Eventable;
  exports.ConeTwistConstraint = ConeTwistConstraint;
  exports.HingeConstraint = HingeConstraint;
  exports.PointConstraint = PointConstraint;
  exports.SliderConstraint = SliderConstraint;
  exports.DOFConstraint = DOFConstraint;
  exports.WorldModule = WorldModule;
  exports.BoxModule = BoxModule;
  exports.CompoundModule = CompoundModule;
  exports.CapsuleModule = CapsuleModule;
  exports.ConcaveModule = ConcaveModule;
  exports.ConeModule = ConeModule;
  exports.ConvexModule = ConvexModule;
  exports.CylinderModule = CylinderModule;
  exports.HeightfieldModule = HeightfieldModule;
  exports.PlaneModule = PlaneModule;
  exports.SphereModule = SphereModule;
  exports.SoftbodyModule = SoftbodyModule;
  exports.ClothModule = ClothModule;
  exports.RopeModule = RopeModule;
  exports.FirstPersonModule = FirstPersonModule;
  exports.ThirdPersonModule = ThirdPersonModule;

  Object.defineProperty(exports, '__esModule', { value: true });

})));
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicGh5c2ljcy1tb2R1bGUuanMubWFwIiwic291cmNlcyI6WyIuLi9zcmMvYXBpLmpzIiwiLi4vc3JjL2V2ZW50YWJsZS5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Db25lVHdpc3RDb25zdHJhaW50LmpzIiwiLi4vc3JjL2NvbnN0cmFpbnRzL0hpbmdlQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9Qb2ludENvbnN0cmFpbnQuanMiLCIuLi9zcmMvY29uc3RyYWludHMvU2xpZGVyQ29uc3RyYWludC5qcyIsIi4uL3NyYy9jb25zdHJhaW50cy9ET0ZDb25zdHJhaW50LmpzIiwiLi4vc3JjL3ZlaGljbGUvdmVoaWNsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL2NvcmUvV29ybGRNb2R1bGVCYXNlLmpzIiwiLi4vYnVuZGxlLXdvcmtlci93b3JrZXJoZWxwZXIuanMiLCIuLi9zcmMvd29ya2VyLmpzIiwiLi4vc3JjL21vZHVsZXMvV29ybGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb3JlL1BoeXNpY3NNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Cb3hNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db21wb3VuZE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NhcHN1bGVNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Db25jYXZlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ29uZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0NvbnZleE1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL0N5bGluZGVyTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvSGVpZ2h0ZmllbGRNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9QbGFuZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NwaGVyZU1vZHVsZS5qcyIsIi4uL3NyYy9tb2R1bGVzL1NvZnRib2R5TW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvQ2xvdGhNb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9Sb3BlTW9kdWxlLmpzIiwiLi4vc3JjL21vZHVsZXMvY29udHJvbHMvRmlyc3RQZXJzb25Nb2R1bGUuanMiLCIuLi9zcmMvbW9kdWxlcy9jb250cm9scy9UaGlyZFBlcnNvbk1vZHVsZS5qcyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQge1xuICBWZWN0b3IzLFxuICBNYXRyaXg0LFxuICBRdWF0ZXJuaW9uXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuY29uc3QgUkVQT1JUX0lURU1TSVpFID0gMTQsXG4gIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSA9IDUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LFxuICBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFID0gNjtcblxuY29uc3QgdGVtcDFWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDJWZWN0b3IzID0gbmV3IFZlY3RvcjMoKSxcbiAgdGVtcDFNYXRyaXg0ID0gbmV3IE1hdHJpeDQoKSxcbiAgdGVtcDFRdWF0ID0gbmV3IFF1YXRlcm5pb24oKTtcblxuY29uc3QgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbiA9ICh4LCB5LCB6LCB3KSA9PiB7XG4gIHJldHVybiBuZXcgVmVjdG9yMyhcbiAgICBNYXRoLmF0YW4yKDIgKiAoeCAqIHcgLSB5ICogeiksICh3ICogdyAtIHggKiB4IC0geSAqIHkgKyB6ICogeikpLFxuICAgIE1hdGguYXNpbigyICogKHggKiB6ICsgeSAqIHcpKSxcbiAgICBNYXRoLmF0YW4yKDIgKiAoeiAqIHcgLSB4ICogeSksICh3ICogdyArIHggKiB4IC0geSAqIHkgLSB6ICogeikpXG4gICk7XG59O1xuXG5jb25zdCBnZXRRdWF0ZXJ0aW9uRnJvbUV1bGVyID0gKHgsIHksIHopID0+IHtcbiAgY29uc3QgYzEgPSBNYXRoLmNvcyh5KTtcbiAgY29uc3QgczEgPSBNYXRoLnNpbih5KTtcbiAgY29uc3QgYzIgPSBNYXRoLmNvcygteik7XG4gIGNvbnN0IHMyID0gTWF0aC5zaW4oLXopO1xuICBjb25zdCBjMyA9IE1hdGguY29zKHgpO1xuICBjb25zdCBzMyA9IE1hdGguc2luKHgpO1xuICBjb25zdCBjMWMyID0gYzEgKiBjMjtcbiAgY29uc3QgczFzMiA9IHMxICogczI7XG5cbiAgcmV0dXJuIHtcbiAgICB3OiBjMWMyICogYzMgLSBzMXMyICogczMsXG4gICAgeDogYzFjMiAqIHMzICsgczFzMiAqIGMzLFxuICAgIHk6IHMxICogYzIgKiBjMyArIGMxICogczIgKiBzMyxcbiAgICB6OiBjMSAqIHMyICogYzMgLSBzMSAqIGMyICogczNcbiAgfTtcbn07XG5cbmNvbnN0IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgPSAocG9zaXRpb24sIG9iamVjdCkgPT4ge1xuICB0ZW1wMU1hdHJpeDQuaWRlbnRpdHkoKTsgLy8gcmVzZXQgdGVtcCBtYXRyaXhcblxuICAvLyBTZXQgdGhlIHRlbXAgbWF0cml4J3Mgcm90YXRpb24gdG8gdGhlIG9iamVjdCdzIHJvdGF0aW9uXG4gIHRlbXAxTWF0cml4NC5pZGVudGl0eSgpLm1ha2VSb3RhdGlvbkZyb21RdWF0ZXJuaW9uKG9iamVjdC5xdWF0ZXJuaW9uKTtcblxuICAvLyBJbnZlcnQgcm90YXRpb24gbWF0cml4IGluIG9yZGVyIHRvIFwidW5yb3RhdGVcIiBhIHBvaW50IGJhY2sgdG8gb2JqZWN0IHNwYWNlXG4gIHRlbXAxTWF0cml4NC5nZXRJbnZlcnNlKHRlbXAxTWF0cml4NCk7XG5cbiAgLy8gWWF5ISBUZW1wIHZhcnMhXG4gIHRlbXAxVmVjdG9yMy5jb3B5KHBvc2l0aW9uKTtcbiAgdGVtcDJWZWN0b3IzLmNvcHkob2JqZWN0LnBvc2l0aW9uKTtcblxuICAvLyBBcHBseSB0aGUgcm90YXRpb25cbiAgcmV0dXJuIHRlbXAxVmVjdG9yMy5zdWIodGVtcDJWZWN0b3IzKS5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcbn07XG5cbmNvbnN0IGFkZE9iamVjdENoaWxkcmVuID0gZnVuY3Rpb24gKHBhcmVudCwgb2JqZWN0KSB7XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgb2JqZWN0LmNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XG4gICAgY29uc3QgY2hpbGQgPSBvYmplY3QuY2hpbGRyZW5baV07XG4gICAgY29uc3QgcGh5c2ljcyA9IGNoaWxkLmNvbXBvbmVudCA/IGNoaWxkLmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSA6IGZhbHNlO1xuXG4gICAgaWYgKHBoeXNpY3MpIHtcbiAgICAgIGNvbnN0IGRhdGEgPSBwaHlzaWNzLmRhdGE7XG5cbiAgICAgIGNoaWxkLnVwZGF0ZU1hdHJpeCgpO1xuICAgICAgY2hpbGQudXBkYXRlTWF0cml4V29ybGQoKTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldEZyb21NYXRyaXhQb3NpdGlvbihjaGlsZC5tYXRyaXhXb3JsZCk7XG4gICAgICB0ZW1wMVF1YXQuc2V0RnJvbVJvdGF0aW9uTWF0cml4KGNoaWxkLm1hdHJpeFdvcmxkKTtcblxuICAgICAgZGF0YS5wb3NpdGlvbl9vZmZzZXQgPSB7XG4gICAgICAgIHg6IHRlbXAxVmVjdG9yMy54LFxuICAgICAgICB5OiB0ZW1wMVZlY3RvcjMueSxcbiAgICAgICAgejogdGVtcDFWZWN0b3IzLnpcbiAgICAgIH07XG5cbiAgICAgIGRhdGEucm90YXRpb24gPSB7XG4gICAgICAgIHg6IHRlbXAxUXVhdC54LFxuICAgICAgICB5OiB0ZW1wMVF1YXQueSxcbiAgICAgICAgejogdGVtcDFRdWF0LnosXG4gICAgICAgIHc6IHRlbXAxUXVhdC53XG4gICAgICB9O1xuXG4gICAgICBwYXJlbnQuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGEuY2hpbGRyZW4ucHVzaChkYXRhKTtcbiAgICB9XG5cbiAgICBhZGRPYmplY3RDaGlsZHJlbihwYXJlbnQsIGNoaWxkKTtcbiAgfVxufTtcblxuZXhwb3J0IHtcbiAgZ2V0RXVsZXJYWVpGcm9tUXVhdGVybmlvbixcbiAgZ2V0UXVhdGVydGlvbkZyb21FdWxlcixcbiAgY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdCxcbiAgYWRkT2JqZWN0Q2hpbGRyZW4sXG5cbiAgTUVTU0FHRV9UWVBFUyxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUsXG5cbiAgdGVtcDFWZWN0b3IzLFxuICB0ZW1wMlZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgdGVtcDFRdWF0XG59O1xuIiwiZXhwb3J0IGNsYXNzIEV2ZW50YWJsZSB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzID0ge307XG4gIH1cblxuICBhZGRFdmVudExpc3RlbmVyKGV2ZW50X25hbWUsIGNhbGxiYWNrKSB7XG4gICAgaWYgKCF0aGlzLl9ldmVudExpc3RlbmVycy5oYXNPd25Qcm9wZXJ0eShldmVudF9uYW1lKSlcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdID0gW107XG5cbiAgICB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5wdXNoKGNhbGxiYWNrKTtcbiAgfVxuXG4gIHJlbW92ZUV2ZW50TGlzdGVuZXIoZXZlbnRfbmFtZSwgY2FsbGJhY2spIHtcbiAgICBsZXQgaW5kZXg7XG5cbiAgICBpZiAoIXRoaXMuX2V2ZW50TGlzdGVuZXJzLmhhc093blByb3BlcnR5KGV2ZW50X25hbWUpKSByZXR1cm4gZmFsc2U7XG5cbiAgICBpZiAoKGluZGV4ID0gdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV0uaW5kZXhPZihjYWxsYmFjaykpID49IDApIHtcbiAgICAgIHRoaXMuX2V2ZW50TGlzdGVuZXJzW2V2ZW50X25hbWVdLnNwbGljZShpbmRleCwgMSk7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG5cbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBkaXNwYXRjaEV2ZW50KGV2ZW50X25hbWUpIHtcbiAgICBsZXQgaTtcbiAgICBjb25zdCBwYXJhbWV0ZXJzID0gQXJyYXkucHJvdG90eXBlLnNwbGljZS5jYWxsKGFyZ3VtZW50cywgMSk7XG5cbiAgICBpZiAodGhpcy5fZXZlbnRMaXN0ZW5lcnMuaGFzT3duUHJvcGVydHkoZXZlbnRfbmFtZSkpIHtcbiAgICAgIGZvciAoaSA9IDA7IGkgPCB0aGlzLl9ldmVudExpc3RlbmVyc1tldmVudF9uYW1lXS5sZW5ndGg7IGkrKylcbiAgICAgICAgdGhpcy5fZXZlbnRMaXN0ZW5lcnNbZXZlbnRfbmFtZV1baV0uYXBwbHkodGhpcywgcGFyYW1ldGVycyk7XG4gICAgfVxuICB9XG5cbiAgc3RhdGljIG1ha2Uob2JqKSB7XG4gICAgb2JqLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyID0gRXZlbnRhYmxlLnByb3RvdHlwZS5hZGRFdmVudExpc3RlbmVyO1xuICAgIG9iai5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lciA9IEV2ZW50YWJsZS5wcm90b3R5cGUucmVtb3ZlRXZlbnRMaXN0ZW5lcjtcbiAgICBvYmoucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQgPSBFdmVudGFibGUucHJvdG90eXBlLmRpc3BhdGNoRXZlbnQ7XG4gIH1cbn1cbiIsImltcG9ydCB7IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QgfSBmcm9tICcuLi9hcGknO1xuaW1wb3J0IHsgRXVsZXIsIE1hdHJpeDQsIFF1YXRlcm5pb24sIFZlY3RvcjMgfSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lVHdpc3RDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBjb25zdCBvYmplY3RiID0gb2JqYTtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSBjb25zb2xlLmVycm9yKCdCb3RoIG9iamVjdHMgbXVzdCBiZSBkZWZpbmVkIGluIGEgQ29uZVR3aXN0Q29uc3RyYWludC4nKTtcblxuICAgIHRoaXMudHlwZSA9ICdjb25ldHdpc3QnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGEpLmNsb25lKCk7XG4gICAgdGhpcy5vYmplY3RiID0gb2JqZWN0Yi51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0ge3g6IG9iamVjdGEucm90YXRpb24ueCwgeTogb2JqZWN0YS5yb3RhdGlvbi55LCB6OiBvYmplY3RhLnJvdGF0aW9uLnp9O1xuICAgIHRoaXMuYXhpc2IgPSB7eDogb2JqZWN0Yi5yb3RhdGlvbi54LCB5OiBvYmplY3RiLnJvdGF0aW9uLnksIHo6IG9iamVjdGIucm90YXRpb24uen07XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW1pdCh4LCB5LCB6KSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TGltaXQnLCB7Y29uc3RyYWludDogdGhpcy5pZCwgeCwgeSwgen0pO1xuICB9XG5cbiAgZW5hYmxlTW90b3IoKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3RfZW5hYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgc2V0TWF4TW90b3JJbXB1bHNlKG1heF9pbXB1bHNlKSB7XG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TWF4TW90b3JJbXB1bHNlJywge2NvbnN0cmFpbnQ6IHRoaXMuaWQsIG1heF9pbXB1bHNlfSk7XG4gIH1cblxuICBzZXRNb3RvclRhcmdldCh0YXJnZXQpIHtcbiAgICBpZiAodGFyZ2V0IGluc3RhbmNlb2YgVmVjdG9yMylcbiAgICAgIHRhcmdldCA9IG5ldyBRdWF0ZXJuaW9uKCkuc2V0RnJvbUV1bGVyKG5ldyBFdWxlcih0YXJnZXQueCwgdGFyZ2V0LnksIHRhcmdldC56KSk7XG4gICAgZWxzZSBpZiAodGFyZ2V0IGluc3RhbmNlb2YgRXVsZXIpXG4gICAgICB0YXJnZXQgPSBuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcih0YXJnZXQpO1xuICAgIGVsc2UgaWYgKHRhcmdldCBpbnN0YW5jZW9mIE1hdHJpeDQpXG4gICAgICB0YXJnZXQgPSBuZXcgUXVhdGVybmlvbigpLnNldEZyb21Sb3RhdGlvbk1hdHJpeCh0YXJnZXQpO1xuXG4gICAgaWYodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdjb25ldHdpc3Rfc2V0TW90b3JUYXJnZXQnLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgeDogdGFyZ2V0LngsXG4gICAgICB5OiB0YXJnZXQueSxcbiAgICAgIHo6IHRhcmdldC56LFxuICAgICAgdzogdGFyZ2V0LndcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IHtjb252ZXJ0V29ybGRQb3NpdGlvblRvT2JqZWN0fSBmcm9tICcuLi9hcGknO1xuXG5leHBvcnQgY2xhc3MgSGluZ2VDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24sIGF4aXMpIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoYXhpcyA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBheGlzID0gcG9zaXRpb247XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdoaW5nZSc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLnBvc2l0aW9uID0gcG9zaXRpb24uY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsb3csIGhpZ2gsIGJpYXNfZmFjdG9yLCByZWxheGF0aW9uX2ZhY3Rvcikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ2hpbmdlX3NldExpbWl0cycsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICBsb3csXG4gICAgICBoaWdoLFxuICAgICAgYmlhc19mYWN0b3IsXG4gICAgICByZWxheGF0aW9uX2ZhY3RvclxuICAgIH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVNb3RvcigpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdoaW5nZV9kaXNhYmxlTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBQb2ludENvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbikge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChwb3NpdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdwb2ludCc7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcblxuICAgIGlmIChvYmplY3RiKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QocG9zaXRpb24sIG9iamVjdGIpLmNsb25lKCk7XG4gICAgfVxuICB9XG5cbiAgZ2V0RGVmaW5pdGlvbigpIHtcbiAgICByZXR1cm4ge1xuICAgICAgdHlwZTogdGhpcy50eXBlLFxuICAgICAgaWQ6IHRoaXMuaWQsXG4gICAgICBvYmplY3RhOiB0aGlzLm9iamVjdGEsXG4gICAgICBvYmplY3RiOiB0aGlzLm9iamVjdGIsXG4gICAgICBwb3NpdGlvbmE6IHRoaXMucG9zaXRpb25hLFxuICAgICAgcG9zaXRpb25iOiB0aGlzLnBvc2l0aW9uYlxuICAgIH07XG4gIH1cbn1cbiIsImltcG9ydCB7Y29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdH0gZnJvbSAnLi4vYXBpJztcblxuZXhwb3J0IGNsYXNzIFNsaWRlckNvbnN0cmFpbnQge1xuICBjb25zdHJ1Y3RvcihvYmphLCBvYmpiLCBwb3NpdGlvbiwgYXhpcykge1xuICAgIGNvbnN0IG9iamVjdGEgPSBvYmphO1xuICAgIGxldCBvYmplY3RiID0gb2JqYjtcblxuICAgIGlmIChheGlzID09PSB1bmRlZmluZWQpIHtcbiAgICAgIGF4aXMgPSBwb3NpdGlvbjtcbiAgICAgIHBvc2l0aW9uID0gb2JqZWN0YjtcbiAgICAgIG9iamVjdGIgPSB1bmRlZmluZWQ7XG4gICAgfVxuXG4gICAgdGhpcy50eXBlID0gJ3NsaWRlcic7XG4gICAgdGhpcy5hcHBsaWVkSW1wdWxzZSA9IDA7XG4gICAgdGhpcy53b3JsZE1vZHVsZSA9IG51bGw7IC8vIFdpbGwgYmUgcmVkZWZpbmVkIGJ5IC5hZGRDb25zdHJhaW50XG4gICAgdGhpcy5vYmplY3RhID0gb2JqZWN0YS51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuICAgIHRoaXMucG9zaXRpb25hID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YSkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXMgPSBheGlzO1xuXG4gICAgaWYgKG9iamVjdGIpIHtcbiAgICAgIHRoaXMub2JqZWN0YiA9IG9iamVjdGIudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICAgIHRoaXMucG9zaXRpb25iID0gY29udmVydFdvcmxkUG9zaXRpb25Ub09iamVjdChwb3NpdGlvbiwgb2JqZWN0YikuY2xvbmUoKTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpczogdGhpcy5heGlzXG4gICAgfTtcbiAgfVxuXG4gIHNldExpbWl0cyhsaW5fbG93ZXIsIGxpbl91cHBlciwgYW5nX2xvd2VyLCBhbmdfdXBwZXIpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCdzbGlkZXJfc2V0TGltaXRzJywge1xuICAgICAgY29uc3RyYWludDogdGhpcy5pZCxcbiAgICAgIGxpbl9sb3dlcixcbiAgICAgIGxpbl91cHBlcixcbiAgICAgIGFuZ19sb3dlcixcbiAgICAgIGFuZ191cHBlclxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVzdGl0dXRpb24obGluZWFyLCBhbmd1bGFyKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZShcbiAgICAgICdzbGlkZXJfc2V0UmVzdGl0dXRpb24nLFxuICAgICAge1xuICAgICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgICBsaW5lYXIsXG4gICAgICAgIGFuZ3VsYXJcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgZW5hYmxlTGluZWFyTW90b3IodmVsb2NpdHksIGFjY2VsZXJhdGlvbikge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVMaW5lYXJNb3RvcicsIHtcbiAgICAgIGNvbnN0cmFpbnQ6IHRoaXMuaWQsXG4gICAgICB2ZWxvY2l0eSxcbiAgICAgIGFjY2VsZXJhdGlvblxuICAgIH0pO1xuICB9XG5cbiAgZGlzYWJsZUxpbmVhck1vdG9yKCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoJ3NsaWRlcl9kaXNhYmxlTGluZWFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG5cbiAgZW5hYmxlQW5ndWxhck1vdG9yKHZlbG9jaXR5LCBhY2NlbGVyYXRpb24pIHtcbiAgICB0aGlzLnNjZW5lLmV4ZWN1dGUoJ3NsaWRlcl9lbmFibGVBbmd1bGFyTW90b3InLCB7XG4gICAgICBjb25zdHJhaW50OiB0aGlzLmlkLFxuICAgICAgdmVsb2NpdHksXG4gICAgICBhY2NlbGVyYXRpb25cbiAgICB9KTtcbiAgfVxuXG4gIGRpc2FibGVBbmd1bGFyTW90b3IoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSgnc2xpZGVyX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7Y29uc3RyYWludDogdGhpcy5pZH0pO1xuICB9XG59XG4iLCJpbXBvcnQge2NvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3R9IGZyb20gJy4uL2FwaSc7XG5cbmV4cG9ydCBjbGFzcyBET0ZDb25zdHJhaW50IHtcbiAgY29uc3RydWN0b3Iob2JqYSwgb2JqYiwgcG9zaXRpb24pIHtcbiAgICBjb25zdCBvYmplY3RhID0gb2JqYTtcbiAgICBsZXQgb2JqZWN0YiA9IG9iamI7XG5cbiAgICBpZiAoIHBvc2l0aW9uID09PSB1bmRlZmluZWQgKSB7XG4gICAgICBwb3NpdGlvbiA9IG9iamVjdGI7XG4gICAgICBvYmplY3RiID0gdW5kZWZpbmVkO1xuICAgIH1cblxuICAgIHRoaXMudHlwZSA9ICdkb2YnO1xuICAgIHRoaXMuYXBwbGllZEltcHVsc2UgPSAwO1xuICAgIHRoaXMud29ybGRNb2R1bGUgPSBudWxsOyAvLyBXaWxsIGJlIHJlZGVmaW5lZCBieSAuYWRkQ29uc3RyYWludFxuICAgIHRoaXMub2JqZWN0YSA9IG9iamVjdGEudXNlKCdwaHlzaWNzJykuZGF0YS5pZDtcbiAgICB0aGlzLnBvc2l0aW9uYSA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RhICkuY2xvbmUoKTtcbiAgICB0aGlzLmF4aXNhID0geyB4OiBvYmplY3RhLnJvdGF0aW9uLngsIHk6IG9iamVjdGEucm90YXRpb24ueSwgejogb2JqZWN0YS5yb3RhdGlvbi56IH07XG5cbiAgICBpZiAoIG9iamVjdGIgKSB7XG4gICAgICB0aGlzLm9iamVjdGIgPSBvYmplY3RiLnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG4gICAgICB0aGlzLnBvc2l0aW9uYiA9IGNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QoIHBvc2l0aW9uLCBvYmplY3RiICkuY2xvbmUoKTtcbiAgICAgIHRoaXMuYXhpc2IgPSB7IHg6IG9iamVjdGIucm90YXRpb24ueCwgeTogb2JqZWN0Yi5yb3RhdGlvbi55LCB6OiBvYmplY3RiLnJvdGF0aW9uLnogfTtcbiAgICB9XG4gIH1cblxuICBnZXREZWZpbml0aW9uKCkge1xuICAgIHJldHVybiB7XG4gICAgICB0eXBlOiB0aGlzLnR5cGUsXG4gICAgICBpZDogdGhpcy5pZCxcbiAgICAgIG9iamVjdGE6IHRoaXMub2JqZWN0YSxcbiAgICAgIG9iamVjdGI6IHRoaXMub2JqZWN0YixcbiAgICAgIHBvc2l0aW9uYTogdGhpcy5wb3NpdGlvbmEsXG4gICAgICBwb3NpdGlvbmI6IHRoaXMucG9zaXRpb25iLFxuICAgICAgYXhpc2E6IHRoaXMuYXhpc2EsXG4gICAgICBheGlzYjogdGhpcy5heGlzYlxuICAgIH07XG4gIH1cblxuICBzZXRMaW5lYXJMb3dlckxpbWl0KGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRMaW5lYXJMb3dlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldExpbmVhclVwcGVyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRMaW5lYXJVcHBlckxpbWl0JywgeyBjb25zdHJhaW50OiB0aGlzLmlkLCB4OiBsaW1pdC54LCB5OiBsaW1pdC55LCB6OiBsaW1pdC56IH0gKTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJMb3dlckxpbWl0IChsaW1pdCkge1xuICAgIGlmICh0aGlzLndvcmxkTW9kdWxlKSB0aGlzLndvcmxkTW9kdWxlLmV4ZWN1dGUoICdkb2Zfc2V0QW5ndWxhckxvd2VyTGltaXQnLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHg6IGxpbWl0LngsIHk6IGxpbWl0LnksIHo6IGxpbWl0LnogfSApO1xuICB9XG5cbiAgc2V0QW5ndWxhclVwcGVyTGltaXQgKGxpbWl0KSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9zZXRBbmd1bGFyVXBwZXJMaW1pdCcsIHsgY29uc3RyYWludDogdGhpcy5pZCwgeDogbGltaXQueCwgeTogbGltaXQueSwgejogbGltaXQueiB9ICk7XG4gIH1cblxuICBlbmFibGVBbmd1bGFyTW90b3IgKHdoaWNoKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9lbmFibGVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCB9ICk7XG4gIH1cblxuICBjb25maWd1cmVBbmd1bGFyTW90b3IgKHdoaWNoLCBsb3dfYW5nbGUsIGhpZ2hfYW5nbGUsIHZlbG9jaXR5LCBtYXhfZm9yY2UgKSB7XG4gICAgaWYgKHRoaXMud29ybGRNb2R1bGUpIHRoaXMud29ybGRNb2R1bGUuZXhlY3V0ZSggJ2RvZl9jb25maWd1cmVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCwgbG93X2FuZ2xlOiBsb3dfYW5nbGUsIGhpZ2hfYW5nbGU6IGhpZ2hfYW5nbGUsIHZlbG9jaXR5OiB2ZWxvY2l0eSwgbWF4X2ZvcmNlOiBtYXhfZm9yY2UgfSApO1xuICB9XG5cbiAgZGlzYWJsZUFuZ3VsYXJNb3RvciAod2hpY2gpIHtcbiAgICBpZiAodGhpcy53b3JsZE1vZHVsZSkgdGhpcy53b3JsZE1vZHVsZS5leGVjdXRlKCAnZG9mX2Rpc2FibGVBbmd1bGFyTW90b3InLCB7IGNvbnN0cmFpbnQ6IHRoaXMuaWQsIHdoaWNoOiB3aGljaCB9ICk7XG4gIH1cbn1cbiIsImltcG9ydCB7TWVzaH0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IHtWZWhpY2xlVHVubmluZ30gZnJvbSAnLi90dW5uaW5nJztcblxuZXhwb3J0IGNsYXNzIFZlaGljbGUge1xuICBjb25zdHJ1Y3RvcihtZXNoLCB0dW5pbmcgPSBuZXcgVmVoaWNsZVR1bmluZygpKSB7XG4gICAgdGhpcy5tZXNoID0gbWVzaDtcbiAgICB0aGlzLndoZWVscyA9IFtdO1xuXG4gICAgdGhpcy5fcGh5c2lqcyA9IHtcbiAgICAgIGlkOiBnZXRPYmplY3RJZCgpLFxuICAgICAgcmlnaWRCb2R5OiBtZXNoLl9waHlzaWpzLmlkLFxuICAgICAgc3VzcGVuc2lvbl9zdGlmZm5lc3M6IHR1bmluZy5zdXNwZW5zaW9uX3N0aWZmbmVzcyxcbiAgICAgIHN1c3BlbnNpb25fY29tcHJlc3Npb246IHR1bmluZy5zdXNwZW5zaW9uX2NvbXByZXNzaW9uLFxuICAgICAgc3VzcGVuc2lvbl9kYW1waW5nOiB0dW5pbmcuc3VzcGVuc2lvbl9kYW1waW5nLFxuICAgICAgbWF4X3N1c3BlbnNpb25fdHJhdmVsOiB0dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsLFxuICAgICAgZnJpY3Rpb25fc2xpcDogdHVuaW5nLmZyaWN0aW9uX3NsaXAsXG4gICAgICBtYXhfc3VzcGVuc2lvbl9mb3JjZTogdHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlXG4gICAgfTtcbiAgfVxuXG4gIGFkZFdoZWVsKHdoZWVsX2dlb21ldHJ5LCB3aGVlbF9tYXRlcmlhbCwgY29ubmVjdGlvbl9wb2ludCwgd2hlZWxfZGlyZWN0aW9uLCB3aGVlbF9heGxlLCBzdXNwZW5zaW9uX3Jlc3RfbGVuZ3RoLCB3aGVlbF9yYWRpdXMsIGlzX2Zyb250X3doZWVsLCB0dW5pbmcpIHtcbiAgICBjb25zdCB3aGVlbCA9IG5ldyBNZXNoKHdoZWVsX2dlb21ldHJ5LCB3aGVlbF9tYXRlcmlhbCk7XG5cbiAgICB3aGVlbC5jYXN0U2hhZG93ID0gd2hlZWwucmVjZWl2ZVNoYWRvdyA9IHRydWU7XG4gICAgd2hlZWwucG9zaXRpb24uY29weSh3aGVlbF9kaXJlY3Rpb24pLm11bHRpcGx5U2NhbGFyKHN1c3BlbnNpb25fcmVzdF9sZW5ndGggLyAxMDApLmFkZChjb25uZWN0aW9uX3BvaW50KTtcblxuICAgIHRoaXMud29ybGQuYWRkKHdoZWVsKTtcbiAgICB0aGlzLndoZWVscy5wdXNoKHdoZWVsKTtcblxuICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYWRkV2hlZWwnLCB7XG4gICAgICBpZDogdGhpcy5fcGh5c2lqcy5pZCxcbiAgICAgIGNvbm5lY3Rpb25fcG9pbnQ6IHt4OiBjb25uZWN0aW9uX3BvaW50LngsIHk6IGNvbm5lY3Rpb25fcG9pbnQueSwgejogY29ubmVjdGlvbl9wb2ludC56fSxcbiAgICAgIHdoZWVsX2RpcmVjdGlvbjoge3g6IHdoZWVsX2RpcmVjdGlvbi54LCB5OiB3aGVlbF9kaXJlY3Rpb24ueSwgejogd2hlZWxfZGlyZWN0aW9uLnp9LFxuICAgICAgd2hlZWxfYXhsZToge3g6IHdoZWVsX2F4bGUueCwgeTogd2hlZWxfYXhsZS55LCB6OiB3aGVlbF9heGxlLnp9LFxuICAgICAgc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIHdoZWVsX3JhZGl1cyxcbiAgICAgIGlzX2Zyb250X3doZWVsLFxuICAgICAgdHVuaW5nXG4gICAgfSk7XG4gIH1cblxuICBzZXRTdGVlcmluZyhhbW91bnQsIHdoZWVsKSB7XG4gICAgaWYgKHdoZWVsICE9PSB1bmRlZmluZWQgJiYgdGhpcy53aGVlbHNbd2hlZWxdICE9PSB1bmRlZmluZWQpXG4gICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldFN0ZWVyaW5nJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgc3RlZXJpbmc6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnc2V0U3RlZXJpbmcnLCB7aWQ6IHRoaXMuX3BoeXNpanMuaWQsIHdoZWVsOiBpLCBzdGVlcmluZzogYW1vdW50fSk7XG4gICAgfVxuICB9XG5cbiAgc2V0QnJha2UoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdzZXRCcmFrZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWwsIGJyYWtlOiBhbW91bnR9KTtcbiAgICBlbHNlIGlmICh0aGlzLndoZWVscy5sZW5ndGggPiAwKSB7XG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMud2hlZWxzLmxlbmd0aDsgaSsrKVxuICAgICAgICB0aGlzLndvcmxkLmV4ZWN1dGUoJ3NldEJyYWtlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbDogaSwgYnJha2U6IGFtb3VudH0pO1xuICAgIH1cbiAgfVxuXG4gIGFwcGx5RW5naW5lRm9yY2UoYW1vdW50LCB3aGVlbCkge1xuICAgIGlmICh3aGVlbCAhPT0gdW5kZWZpbmVkICYmIHRoaXMud2hlZWxzW3doZWVsXSAhPT0gdW5kZWZpbmVkKVxuICAgICAgdGhpcy53b3JsZC5leGVjdXRlKCdhcHBseUVuZ2luZUZvcmNlJywge2lkOiB0aGlzLl9waHlzaWpzLmlkLCB3aGVlbCwgZm9yY2U6IGFtb3VudH0pO1xuICAgIGVsc2UgaWYgKHRoaXMud2hlZWxzLmxlbmd0aCA+IDApIHtcbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy53aGVlbHMubGVuZ3RoOyBpKyspXG4gICAgICAgIHRoaXMud29ybGQuZXhlY3V0ZSgnYXBwbHlFbmdpbmVGb3JjZScsIHtpZDogdGhpcy5fcGh5c2lqcy5pZCwgd2hlZWw6IGksIGZvcmNlOiBhbW91bnR9KTtcbiAgICB9XG4gIH1cbn1cbiIsImltcG9ydCB7XG4gIFNjZW5lIGFzIFNjZW5lTmF0aXZlLFxuICBNZXNoLFxuICBTcGhlcmVHZW9tZXRyeSxcbiAgTWVzaE5vcm1hbE1hdGVyaWFsLFxuICBCb3hHZW9tZXRyeSxcbiAgVmVjdG9yM1xufSBmcm9tICd0aHJlZSc7XG5cbmltcG9ydCB7TG9vcH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtWZWhpY2xlfSBmcm9tICcuLi8uLi92ZWhpY2xlL3ZlaGljbGUnO1xuaW1wb3J0IHtFdmVudGFibGV9IGZyb20gJy4uLy4uL2V2ZW50YWJsZSc7XG5cbmltcG9ydCB7XG4gIGFkZE9iamVjdENoaWxkcmVuLFxuICBNRVNTQUdFX1RZUEVTLFxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkVcbn0gZnJvbSAnLi4vLi4vYXBpJztcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgV29ybGRNb2R1bGVCYXNlIGV4dGVuZHMgRXZlbnRhYmxlIHtcbiAgc3RhdGljIGRlZmF1bHRzID0ge1xuICAgIGZpeGVkVGltZVN0ZXA6IDEvNjAsXG4gICAgcmF0ZUxpbWl0OiB0cnVlLFxuICAgIGFtbW86IFwiXCIsXG4gICAgc29mdGJvZHk6IGZhbHNlLFxuICAgIGdyYXZpdHk6IG5ldyBWZWN0b3IzKDAsIDEwMCwgMClcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvcHRpb25zKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMub3B0aW9ucyA9IE9iamVjdC5hc3NpZ24oV29ybGRNb2R1bGVCYXNlLmRlZmF1bHRzLCBvcHRpb25zKTtcblxuICAgIHRoaXMub2JqZWN0cyA9IHt9O1xuICAgIHRoaXMudmVoaWNsZXMgPSB7fTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzID0ge307XG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuZ2V0T2JqZWN0SWQgPSAoKCkgPT4ge1xuICAgICAgbGV0IGlkID0gMTtcbiAgICAgIHJldHVybiAoKSA9PiB7XG4gICAgICAgIHJldHVybiBpZCsrO1xuICAgICAgfTtcbiAgICB9KSgpO1xuICB9XG5cbiAgc2V0dXAoKSB7XG4gICAgdGhpcy5yZWNlaXZlKGV2ZW50ID0+IHtcbiAgICAgIGxldCBfdGVtcCxcbiAgICAgICAgZGF0YSA9IGV2ZW50LmRhdGE7XG5cbiAgICAgIGlmIChkYXRhIGluc3RhbmNlb2YgQXJyYXlCdWZmZXIgJiYgZGF0YS5ieXRlTGVuZ3RoICE9PSAxKS8vIGJ5dGVMZW5ndGggPT09IDEgaXMgdGhlIHdvcmtlciBtYWtpbmcgYSBTVVBQT1JUX1RSQU5TRkVSQUJMRSB0ZXN0XG4gICAgICAgIGRhdGEgPSBuZXcgRmxvYXQzMkFycmF5KGRhdGEpO1xuXG4gICAgICBpZiAoZGF0YSBpbnN0YW5jZW9mIEZsb2F0MzJBcnJheSkge1xuICAgICAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgICAgIHN3aXRjaCAoZGF0YVswXSkge1xuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlU2NlbmUoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5TT0ZUUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTb2Z0Ym9kaWVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb2xsaXNpb25zKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlVmVoaWNsZXMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVDb25zdHJhaW50cyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGRlZmF1bHQ6XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoZGF0YS5jbWQpIHtcbiAgICAgICAgLy8gbm9uLXRyYW5zZmVyYWJsZSBvYmplY3RcbiAgICAgICAgc3dpdGNoIChkYXRhLmNtZCkge1xuICAgICAgICAgIGNhc2UgJ29iamVjdFJlYWR5JzpcbiAgICAgICAgICAgIF90ZW1wID0gZGF0YS5wYXJhbXM7XG4gICAgICAgICAgICBpZiAodGhpcy5vYmplY3RzW190ZW1wXSkgdGhpcy5vYmplY3RzW190ZW1wXS5kaXNwYXRjaEV2ZW50KCdyZWFkeScpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd3b3JsZFJlYWR5JzpcbiAgICAgICAgICAgIHRoaXMuZGlzcGF0Y2hFdmVudCgncmVhZHknKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSAnYW1tb0xvYWRlZCc6XG4gICAgICAgICAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ2xvYWRlZCcpO1xuICAgICAgICAgICAgLy8gY29uc29sZS5sb2coXCJQaHlzaWNzIGxvYWRpbmcgdGltZTogXCIgKyAocGVyZm9ybWFuY2Uubm93KCkgLSBzdGFydCkgKyBcIm1zXCIpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlICd2ZWhpY2xlJzpcbiAgICAgICAgICAgIHdpbmRvdy50ZXN0ID0gZGF0YTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgZGVmYXVsdDpcbiAgICAgICAgICAgIC8vIERvIG5vdGhpbmcsIGp1c3Qgc2hvdyB0aGUgbWVzc2FnZVxuICAgICAgICAgICAgY29uc29sZS5kZWJ1ZyhgUmVjZWl2ZWQ6ICR7ZGF0YS5jbWR9YCk7XG4gICAgICAgICAgICBjb25zb2xlLmRpcihkYXRhLnBhcmFtcyk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3dpdGNoIChkYXRhWzBdKSB7XG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAgICAgICAgdGhpcy51cGRhdGVTY2VuZShkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTExJU0lPTlJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29sbGlzaW9ucyhkYXRhKTtcbiAgICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgICAgY2FzZSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ6XG4gICAgICAgICAgICB0aGlzLnVwZGF0ZVZlaGljbGVzKGRhdGEpO1xuICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICBjYXNlIE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDpcbiAgICAgICAgICAgIHRoaXMudXBkYXRlQ29uc3RyYWludHMoZGF0YSk7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBkZWZhdWx0OlxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSk7XG4gIH1cblxuICB1cGRhdGVTY2VuZShpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXTtcblxuICAgIHdoaWxlIChpbmRleC0tKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAyICsgaW5kZXggKiBSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcbiAgICAgIGNvbnN0IGNvbXBvbmVudCA9IG9iamVjdC5jb21wb25lbnQ7XG4gICAgICBjb25zdCBkYXRhID0gY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGlmIChvYmplY3QgPT09IG51bGwpIGNvbnRpbnVlO1xuXG4gICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlQb3NpdGlvbiA9PT0gZmFsc2UpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDFdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgMl0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyAzXVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPT09IGZhbHNlKSB7XG4gICAgICAgIG9iamVjdC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgICBpbmZvW29mZnNldCArIDRdLFxuICAgICAgICAgIGluZm9bb2Zmc2V0ICsgNV0sXG4gICAgICAgICAgaW5mb1tvZmZzZXQgKyA2XSxcbiAgICAgICAgICBpbmZvW29mZnNldCArIDddXG4gICAgICAgICk7XG5cbiAgICAgICAgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbiA9IGZhbHNlO1xuICAgICAgfVxuXG4gICAgICBkYXRhLmxpbmVhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA4XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyA5XSxcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMF1cbiAgICAgICk7XG5cbiAgICAgIGRhdGEuYW5ndWxhclZlbG9jaXR5LnNldChcbiAgICAgICAgaW5mb1tvZmZzZXQgKyAxMV0sXG4gICAgICAgIGluZm9bb2Zmc2V0ICsgMTJdLFxuICAgICAgICBpbmZvW29mZnNldCArIDEzXVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChpbmZvLmJ1ZmZlciwgW2luZm8uYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuXG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSBmYWxzZTtcbiAgICB0aGlzLmRpc3BhdGNoRXZlbnQoJ3VwZGF0ZScpO1xuICB9XG5cbiAgdXBkYXRlU29mdGJvZGllcyhpbmZvKSB7XG4gICAgbGV0IGluZGV4ID0gaW5mb1sxXSxcbiAgICAgIG9mZnNldCA9IDI7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgc2l6ZSA9IGluZm9bb2Zmc2V0ICsgMV07XG4gICAgICBjb25zdCBvYmplY3QgPSB0aGlzLm9iamVjdHNbaW5mb1tvZmZzZXRdXTtcblxuICAgICAgaWYgKG9iamVjdCA9PT0gbnVsbCkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IGRhdGEgPSBvYmplY3QuY29tcG9uZW50LnVzZSgncGh5c2ljcycpLmRhdGE7XG5cbiAgICAgIGNvbnN0IGF0dHJpYnV0ZXMgPSBvYmplY3QuZ2VvbWV0cnkuYXR0cmlidXRlcztcbiAgICAgIGNvbnN0IHZvbHVtZVBvc2l0aW9ucyA9IGF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG5cbiAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZyhkYXRhLmlkKTtcbiAgICAgIGlmICghZGF0YS5pc1NvZnRCb2R5UmVzZXQpIHtcbiAgICAgICAgb2JqZWN0LnBvc2l0aW9uLnNldCgwLCAwLCAwKTtcbiAgICAgICAgb2JqZWN0LnF1YXRlcm5pb24uc2V0KDAsIDAsIDAsIDApO1xuXG4gICAgICAgIGRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0VHJpbWVzaFwiKSB7XG4gICAgICAgIGNvbnN0IHZvbHVtZU5vcm1hbHMgPSBhdHRyaWJ1dGVzLm5vcm1hbC5hcnJheTtcblxuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDE4O1xuXG4gICAgICAgICAgY29uc3QgeDEgPSBpbmZvW29mZnNdO1xuICAgICAgICAgIGNvbnN0IHkxID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgejEgPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54MSA9IGluZm9bb2ZmcyArIDNdO1xuICAgICAgICAgIGNvbnN0IG55MSA9IGluZm9bb2ZmcyArIDRdO1xuICAgICAgICAgIGNvbnN0IG56MSA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgY29uc3QgeDIgPSBpbmZvW29mZnMgKyA2XTtcbiAgICAgICAgICBjb25zdCB5MiA9IGluZm9bb2ZmcyArIDddO1xuICAgICAgICAgIGNvbnN0IHoyID0gaW5mb1tvZmZzICsgOF07XG5cbiAgICAgICAgICBjb25zdCBueDIgPSBpbmZvW29mZnMgKyA5XTtcbiAgICAgICAgICBjb25zdCBueTIgPSBpbmZvW29mZnMgKyAxMF07XG4gICAgICAgICAgY29uc3QgbnoyID0gaW5mb1tvZmZzICsgMTFdO1xuXG4gICAgICAgICAgY29uc3QgeDMgPSBpbmZvW29mZnMgKyAxMl07XG4gICAgICAgICAgY29uc3QgeTMgPSBpbmZvW29mZnMgKyAxM107XG4gICAgICAgICAgY29uc3QgejMgPSBpbmZvW29mZnMgKyAxNF07XG5cbiAgICAgICAgICBjb25zdCBueDMgPSBpbmZvW29mZnMgKyAxNV07XG4gICAgICAgICAgY29uc3QgbnkzID0gaW5mb1tvZmZzICsgMTZdO1xuICAgICAgICAgIGNvbnN0IG56MyA9IGluZm9bb2ZmcyArIDE3XTtcblxuICAgICAgICAgIGNvbnN0IGk5ID0gaSAqIDk7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTldID0geDE7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgMV0gPSB5MTtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyAyXSA9IHoxO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgM10gPSB4MjtcbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA0XSA9IHkyO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDVdID0gejI7XG5cbiAgICAgICAgICB2b2x1bWVQb3NpdGlvbnNbaTkgKyA2XSA9IHgzO1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpOSArIDddID0geTM7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2k5ICsgOF0gPSB6MztcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTldID0gbngxO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyAxXSA9IG55MTtcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgMl0gPSBuejE7XG5cbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgM10gPSBueDI7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDRdID0gbnkyO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA1XSA9IG56MjtcblxuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaTkgKyA2XSA9IG54MztcbiAgICAgICAgICB2b2x1bWVOb3JtYWxzW2k5ICsgN10gPSBueTM7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpOSArIDhdID0gbnozO1xuICAgICAgICB9XG5cbiAgICAgICAgYXR0cmlidXRlcy5ub3JtYWwubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgICAgICBvZmZzZXQgKz0gMiArIHNpemUgKiAxODtcbiAgICAgIH1cbiAgICAgIGVsc2UgaWYgKGRhdGEudHlwZSA9PT0gXCJzb2Z0Um9wZU1lc2hcIikge1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgIGNvbnN0IG9mZnMgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICBjb25zdCB4ID0gaW5mb1tvZmZzXTtcbiAgICAgICAgICBjb25zdCB5ID0gaW5mb1tvZmZzICsgMV07XG4gICAgICAgICAgY29uc3QgeiA9IGluZm9bb2ZmcyArIDJdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcbiAgICAgICAgfVxuXG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDM7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb25zdCB2b2x1bWVOb3JtYWxzID0gYXR0cmlidXRlcy5ub3JtYWwuYXJyYXk7XG5cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICBjb25zdCBvZmZzID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgY29uc3QgeCA9IGluZm9bb2Zmc107XG4gICAgICAgICAgY29uc3QgeSA9IGluZm9bb2ZmcyArIDFdO1xuICAgICAgICAgIGNvbnN0IHogPSBpbmZvW29mZnMgKyAyXTtcblxuICAgICAgICAgIGNvbnN0IG54ID0gaW5mb1tvZmZzICsgM107XG4gICAgICAgICAgY29uc3QgbnkgPSBpbmZvW29mZnMgKyA0XTtcbiAgICAgICAgICBjb25zdCBueiA9IGluZm9bb2ZmcyArIDVdO1xuXG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzXSA9IHg7XG4gICAgICAgICAgdm9sdW1lUG9zaXRpb25zW2kgKiAzICsgMV0gPSB5O1xuICAgICAgICAgIHZvbHVtZVBvc2l0aW9uc1tpICogMyArIDJdID0gejtcblxuICAgICAgICAgIC8vIEZJWE1FOiBOb3JtYWxzIGFyZSBwb2ludGVkIHRvIGxvb2sgaW5zaWRlO1xuICAgICAgICAgIHZvbHVtZU5vcm1hbHNbaSAqIDNdID0gbng7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDFdID0gbnk7XG4gICAgICAgICAgdm9sdW1lTm9ybWFsc1tpICogMyArIDJdID0gbno7XG4gICAgICAgIH1cblxuICAgICAgICBhdHRyaWJ1dGVzLm5vcm1hbC5uZWVkc1VwZGF0ZSA9IHRydWU7XG4gICAgICAgIG9mZnNldCArPSAyICsgc2l6ZSAqIDY7XG4gICAgICB9XG5cbiAgICAgIGF0dHJpYnV0ZXMucG9zaXRpb24ubmVlZHNVcGRhdGUgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgIC8vICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG5cbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlO1xuICB9XG5cbiAgdXBkYXRlVmVoaWNsZXMoZGF0YSkge1xuICAgIGxldCB2ZWhpY2xlLCB3aGVlbDtcblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgKGRhdGEubGVuZ3RoIC0gMSkgLyBWRUhJQ0xFUkVQT1JUX0lURU1TSVpFOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyBpICogVkVISUNMRVJFUE9SVF9JVEVNU0laRTtcbiAgICAgIHZlaGljbGUgPSB0aGlzLnZlaGljbGVzW2RhdGFbb2Zmc2V0XV07XG5cbiAgICAgIGlmICh2ZWhpY2xlID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgd2hlZWwgPSB2ZWhpY2xlLndoZWVsc1tkYXRhW29mZnNldCArIDFdXTtcblxuICAgICAgd2hlZWwucG9zaXRpb24uc2V0KFxuICAgICAgICBkYXRhW29mZnNldCArIDJdLFxuICAgICAgICBkYXRhW29mZnNldCArIDNdLFxuICAgICAgICBkYXRhW29mZnNldCArIDRdXG4gICAgICApO1xuXG4gICAgICB3aGVlbC5xdWF0ZXJuaW9uLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA1XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA2XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA3XSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA4XVxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29uc3RyYWludHMoZGF0YSkge1xuICAgIGxldCBjb25zdHJhaW50LCBvYmplY3Q7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IChkYXRhLmxlbmd0aCAtIDEpIC8gQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTsgaSsrKSB7XG4gICAgICBjb25zdCBvZmZzZXQgPSAxICsgaSAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkU7XG4gICAgICBjb25zdHJhaW50ID0gdGhpcy5jb25zdHJhaW50c1tkYXRhW29mZnNldF1dO1xuICAgICAgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2RhdGFbb2Zmc2V0ICsgMV1dO1xuXG4gICAgICBpZiAoY29uc3RyYWludCA9PT0gdW5kZWZpbmVkIHx8IG9iamVjdCA9PT0gdW5kZWZpbmVkKSBjb250aW51ZTtcblxuICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAyXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyAzXSxcbiAgICAgICAgZGF0YVtvZmZzZXQgKyA0XVxuICAgICAgKTtcblxuICAgICAgdGVtcDFNYXRyaXg0LmV4dHJhY3RSb3RhdGlvbihvYmplY3QubWF0cml4KTtcbiAgICAgIHRlbXAxVmVjdG9yMy5hcHBseU1hdHJpeDQodGVtcDFNYXRyaXg0KTtcblxuICAgICAgY29uc3RyYWludC5wb3NpdGlvbmEuYWRkVmVjdG9ycyhvYmplY3QucG9zaXRpb24sIHRlbXAxVmVjdG9yMyk7XG4gICAgICBjb25zdHJhaW50LmFwcGxpZWRJbXB1bHNlID0gZGF0YVtvZmZzZXQgKyA1XTtcbiAgICB9XG5cbiAgICBpZiAodGhpcy5TVVBQT1JUX1RSQU5TRkVSQUJMRSlcbiAgICAgIHRoaXMuc2VuZChkYXRhLmJ1ZmZlciwgW2RhdGEuYnVmZmVyXSk7IC8vIEdpdmUgdGhlIHR5cGVkIGFycmF5IGJhY2sgdG8gdGhlIHdvcmtlclxuICB9XG5cbiAgdXBkYXRlQ29sbGlzaW9ucyhpbmZvKSB7XG4gICAgLyoqXG4gICAgICogI1RPRE9cbiAgICAgKiBUaGlzIGlzIHByb2JhYmx5IHRoZSB3b3JzdCB3YXkgZXZlciB0byBoYW5kbGUgY29sbGlzaW9ucy4gVGhlIGluaGVyZW50IGV2aWxuZXNzIGlzIGEgcmVzaWR1YWxcbiAgICAgKiBlZmZlY3QgZnJvbSB0aGUgcHJldmlvdXMgdmVyc2lvbidzIGV2aWxuZXNzIHdoaWNoIG11dGF0ZWQgd2hlbiBzd2l0Y2hpbmcgdG8gdHJhbnNmZXJhYmxlIG9iamVjdHMuXG4gICAgICpcbiAgICAgKiBJZiB5b3UgZmVlbCBpbmNsaW5lZCB0byBtYWtlIHRoaXMgYmV0dGVyLCBwbGVhc2UgZG8gc28uXG4gICAgICovXG5cbiAgICBjb25zdCBjb2xsaXNpb25zID0ge30sXG4gICAgICBub3JtYWxfb2Zmc2V0cyA9IHt9O1xuXG4gICAgLy8gQnVpbGQgY29sbGlzaW9uIG1hbmlmZXN0XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBpbmZvWzFdOyBpKyspIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyBpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gaW5mb1tvZmZzZXRdO1xuICAgICAgY29uc3Qgb2JqZWN0MiA9IGluZm9bb2Zmc2V0ICsgMV07XG5cbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdH0tJHtvYmplY3QyfWBdID0gb2Zmc2V0ICsgMjtcbiAgICAgIG5vcm1hbF9vZmZzZXRzW2Ake29iamVjdDJ9LSR7b2JqZWN0fWBdID0gLTEgKiAob2Zmc2V0ICsgMik7XG5cbiAgICAgIC8vIFJlZ2lzdGVyIGNvbGxpc2lvbnMgZm9yIGJvdGggdGhlIG9iamVjdCBjb2xsaWRpbmcgYW5kIHRoZSBvYmplY3QgYmVpbmcgY29sbGlkZWQgd2l0aFxuICAgICAgaWYgKCFjb2xsaXNpb25zW29iamVjdF0pIGNvbGxpc2lvbnNbb2JqZWN0XSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3RdLnB1c2gob2JqZWN0Mik7XG5cbiAgICAgIGlmICghY29sbGlzaW9uc1tvYmplY3QyXSkgY29sbGlzaW9uc1tvYmplY3QyXSA9IFtdO1xuICAgICAgY29sbGlzaW9uc1tvYmplY3QyXS5wdXNoKG9iamVjdCk7XG4gICAgfVxuXG4gICAgLy8gRGVhbCB3aXRoIGNvbGxpc2lvbnNcbiAgICBmb3IgKGNvbnN0IGlkMSBpbiB0aGlzLm9iamVjdHMpIHtcbiAgICAgIGlmICghdGhpcy5vYmplY3RzLmhhc093blByb3BlcnR5KGlkMSkpIGNvbnRpbnVlO1xuICAgICAgY29uc3Qgb2JqZWN0ID0gdGhpcy5vYmplY3RzW2lkMV07XG4gICAgICBjb25zdCBjb21wb25lbnQgPSBvYmplY3QuY29tcG9uZW50O1xuICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICBpZiAob2JqZWN0ID09PSBudWxsKSBjb250aW51ZTtcblxuICAgICAgLy8gSWYgb2JqZWN0IHRvdWNoZXMgYW55dGhpbmcsIC4uLlxuICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXSkge1xuICAgICAgICAvLyBDbGVhbiB1cCB0b3VjaGVzIGFycmF5XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgZGF0YS50b3VjaGVzLmxlbmd0aDsgaisrKSB7XG4gICAgICAgICAgaWYgKGNvbGxpc2lvbnNbaWQxXS5pbmRleE9mKGRhdGEudG91Y2hlc1tqXSkgPT09IC0xKVxuICAgICAgICAgICAgZGF0YS50b3VjaGVzLnNwbGljZShqLS0sIDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gSGFuZGxlIGVhY2ggY29sbGlkaW5nIG9iamVjdFxuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGNvbGxpc2lvbnNbaWQxXS5sZW5ndGg7IGorKykge1xuICAgICAgICAgIGNvbnN0IGlkMiA9IGNvbGxpc2lvbnNbaWQxXVtqXTtcbiAgICAgICAgICBjb25zdCBvYmplY3QyID0gdGhpcy5vYmplY3RzW2lkMl07XG5cbiAgICAgICAgICBpZiAob2JqZWN0Mikge1xuICAgICAgICAgICAgY29uc3QgY29tcG9uZW50MiA9IG9iamVjdDIuY29tcG9uZW50O1xuICAgICAgICAgICAgY29uc3QgZGF0YTIgPSBjb21wb25lbnQyLnVzZSgncGh5c2ljcycpLmRhdGE7XG4gICAgICAgICAgICAvLyBJZiBvYmplY3Qgd2FzIG5vdCBhbHJlYWR5IHRvdWNoaW5nIG9iamVjdDIsIG5vdGlmeSBvYmplY3RcbiAgICAgICAgICAgIGlmIChkYXRhLnRvdWNoZXMuaW5kZXhPZihpZDIpID09PSAtMSkge1xuICAgICAgICAgICAgICBkYXRhLnRvdWNoZXMucHVzaChpZDIpO1xuXG4gICAgICAgICAgICAgIGNvbnN0IHZlbCA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuICAgICAgICAgICAgICBjb25zdCB2ZWwyID0gY29tcG9uZW50Mi51c2UoJ3BoeXNpY3MnKS5nZXRMaW5lYXJWZWxvY2l0eSgpO1xuXG4gICAgICAgICAgICAgIHRlbXAxVmVjdG9yMy5zdWJWZWN0b3JzKHZlbCwgdmVsMik7XG4gICAgICAgICAgICAgIGNvbnN0IHRlbXAxID0gdGVtcDFWZWN0b3IzLmNsb25lKCk7XG5cbiAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnN1YlZlY3RvcnModmVsLCB2ZWwyKTtcbiAgICAgICAgICAgICAgY29uc3QgdGVtcDIgPSB0ZW1wMVZlY3RvcjMuY2xvbmUoKTtcblxuICAgICAgICAgICAgICBsZXQgbm9ybWFsX29mZnNldCA9IG5vcm1hbF9vZmZzZXRzW2Ake2RhdGEuaWR9LSR7ZGF0YTIuaWR9YF07XG5cbiAgICAgICAgICAgICAgaWYgKG5vcm1hbF9vZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIC1pbmZvW25vcm1hbF9vZmZzZXRdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDFdLFxuICAgICAgICAgICAgICAgICAgLWluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBub3JtYWxfb2Zmc2V0ICo9IC0xO1xuXG4gICAgICAgICAgICAgICAgdGVtcDFWZWN0b3IzLnNldChcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldF0sXG4gICAgICAgICAgICAgICAgICBpbmZvW25vcm1hbF9vZmZzZXQgKyAxXSxcbiAgICAgICAgICAgICAgICAgIGluZm9bbm9ybWFsX29mZnNldCArIDJdXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIGNvbXBvbmVudC5lbWl0KCdjb2xsaXNpb24nLCBvYmplY3QyLCB0ZW1wMSwgdGVtcDIsIHRlbXAxVmVjdG9yMyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9IGVsc2UgZGF0YS50b3VjaGVzLmxlbmd0aCA9IDA7IC8vIG5vdCB0b3VjaGluZyBvdGhlciBvYmplY3RzXG4gICAgfVxuXG4gICAgdGhpcy5jb2xsaXNpb25zID0gY29sbGlzaW9ucztcblxuICAgIGlmICh0aGlzLlNVUFBPUlRfVFJBTlNGRVJBQkxFKVxuICAgICAgdGhpcy5zZW5kKGluZm8uYnVmZmVyLCBbaW5mby5idWZmZXJdKTsgLy8gR2l2ZSB0aGUgdHlwZWQgYXJyYXkgYmFjayB0byB0aGUgd29ya2VyXG4gIH1cblxuICBhZGRDb25zdHJhaW50KGNvbnN0cmFpbnQsIHNob3dfbWFya2VyKSB7XG4gICAgY29uc3RyYWludC5pZCA9IHRoaXMuZ2V0T2JqZWN0SWQoKTtcbiAgICB0aGlzLmNvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdID0gY29uc3RyYWludDtcbiAgICBjb25zdHJhaW50LndvcmxkTW9kdWxlID0gdGhpcztcbiAgICB0aGlzLmV4ZWN1dGUoJ2FkZENvbnN0cmFpbnQnLCBjb25zdHJhaW50LmdldERlZmluaXRpb24oKSk7XG5cbiAgICBpZiAoc2hvd19tYXJrZXIpIHtcbiAgICAgIGxldCBtYXJrZXI7XG5cbiAgICAgIHN3aXRjaCAoY29uc3RyYWludC50eXBlKSB7XG4gICAgICAgIGNhc2UgJ3BvaW50JzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcblxuICAgICAgICBjYXNlICdoaW5nZSc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnc2xpZGVyJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBCb3hHZW9tZXRyeSgxMCwgMSwgMSksXG4gICAgICAgICAgICBuZXcgTWVzaE5vcm1hbE1hdGVyaWFsKClcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgbWFya2VyLnBvc2l0aW9uLmNvcHkoY29uc3RyYWludC5wb3NpdGlvbmEpO1xuXG4gICAgICAgICAgLy8gVGhpcyByb3RhdGlvbiBpc24ndCByaWdodCBpZiBhbGwgdGhyZWUgYXhpcyBhcmUgbm9uLTAgdmFsdWVzXG4gICAgICAgICAgLy8gVE9ETzogY2hhbmdlIG1hcmtlcidzIHJvdGF0aW9uIG9yZGVyIHRvIFpZWFxuICAgICAgICAgIG1hcmtlci5yb3RhdGlvbi5zZXQoXG4gICAgICAgICAgICBjb25zdHJhaW50LmF4aXMueSwgLy8geWVzLCB5IGFuZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLngsIC8vIHggYXhpcyBhcmUgc3dhcHBlZFxuICAgICAgICAgICAgY29uc3RyYWludC5heGlzLnpcbiAgICAgICAgICApO1xuICAgICAgICAgIHRoaXMub2JqZWN0c1tjb25zdHJhaW50Lm9iamVjdGFdLmFkZChtYXJrZXIpO1xuICAgICAgICAgIGJyZWFrO1xuXG4gICAgICAgIGNhc2UgJ2NvbmV0d2lzdCc6XG4gICAgICAgICAgbWFya2VyID0gbmV3IE1lc2goXG4gICAgICAgICAgICBuZXcgU3BoZXJlR2VvbWV0cnkoMS41KSxcbiAgICAgICAgICAgIG5ldyBNZXNoTm9ybWFsTWF0ZXJpYWwoKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBtYXJrZXIucG9zaXRpb24uY29weShjb25zdHJhaW50LnBvc2l0aW9uYSk7XG4gICAgICAgICAgdGhpcy5vYmplY3RzW2NvbnN0cmFpbnQub2JqZWN0YV0uYWRkKG1hcmtlcik7XG4gICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgY2FzZSAnZG9mJzpcbiAgICAgICAgICBtYXJrZXIgPSBuZXcgTWVzaChcbiAgICAgICAgICAgIG5ldyBTcGhlcmVHZW9tZXRyeSgxLjUpLFxuICAgICAgICAgICAgbmV3IE1lc2hOb3JtYWxNYXRlcmlhbCgpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIG1hcmtlci5wb3NpdGlvbi5jb3B5KGNvbnN0cmFpbnQucG9zaXRpb25hKTtcbiAgICAgICAgICB0aGlzLm9iamVjdHNbY29uc3RyYWludC5vYmplY3RhXS5hZGQobWFya2VyKTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgZGVmYXVsdDpcbiAgICAgIH1cbiAgICB9XG5cbiAgICByZXR1cm4gY29uc3RyYWludDtcbiAgfVxuXG4gIG9uU2ltdWxhdGlvblJlc3VtZSgpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ29uU2ltdWxhdGlvblJlc3VtZScsIHt9KTtcbiAgfVxuXG4gIHJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCkge1xuICAgIGlmICh0aGlzLmNvbnN0cmFpbnRzW2NvbnN0cmFpbnQuaWRdICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlQ29uc3RyYWludCcsIHtpZDogY29uc3RyYWludC5pZH0pO1xuICAgICAgZGVsZXRlIHRoaXMuY29uc3RyYWludHNbY29uc3RyYWludC5pZF07XG4gICAgfVxuICB9XG5cbiAgZXhlY3V0ZShjbWQsIHBhcmFtcykge1xuICAgIHRoaXMuc2VuZCh7Y21kLCBwYXJhbXN9KTtcbiAgfVxuXG4gIG9uQWRkQ2FsbGJhY2soY29tcG9uZW50KSB7XG4gICAgY29uc3Qgb2JqZWN0ID0gY29tcG9uZW50Lm5hdGl2ZTtcbiAgICBjb25zdCBkYXRhID0gb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgaWYgKGRhdGEpIHtcbiAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnNldCgnbW9kdWxlOndvcmxkJywgdGhpcyk7XG4gICAgICBkYXRhLmlkID0gdGhpcy5nZXRPYmplY3RJZCgpO1xuICAgICAgb2JqZWN0LmNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhID0gZGF0YTtcblxuICAgICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgICAgdGhpcy5vbkFkZENhbGxiYWNrKG9iamVjdC5tZXNoKTtcbiAgICAgICAgdGhpcy52ZWhpY2xlc1tkYXRhLmlkXSA9IG9iamVjdDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdhZGRWZWhpY2xlJywgZGF0YSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBjb21wb25lbnQuX19kaXJ0eVBvc2l0aW9uID0gZmFsc2U7XG4gICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgdGhpcy5vYmplY3RzW2RhdGEuaWRdID0gb2JqZWN0O1xuXG4gICAgICAgIGlmIChvYmplY3QuY2hpbGRyZW4ubGVuZ3RoKSB7XG4gICAgICAgICAgZGF0YS5jaGlsZHJlbiA9IFtdO1xuICAgICAgICAgIGFkZE9iamVjdENoaWxkcmVuKG9iamVjdCwgb2JqZWN0KTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIG9iamVjdC5xdWF0ZXJuaW9uLnNldEZyb21FdWxlcihvYmplY3Qucm90YXRpb24pO1xuICAgICAgICAvL1xuICAgICAgICAvLyBjb25zb2xlLmxvZyhvYmplY3QuY29tcG9uZW50KTtcbiAgICAgICAgLy8gY29uc29sZS5sb2cob2JqZWN0LnJvdGF0aW9uKTtcblxuICAgICAgICAvLyBPYmplY3Qgc3RhcnRpbmcgcG9zaXRpb24gKyByb3RhdGlvblxuICAgICAgICBkYXRhLnBvc2l0aW9uID0ge1xuICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5wb3NpdGlvbi55LFxuICAgICAgICAgIHo6IG9iamVjdC5wb3NpdGlvbi56XG4gICAgICAgIH07XG5cbiAgICAgICAgZGF0YS5yb3RhdGlvbiA9IHtcbiAgICAgICAgICB4OiBvYmplY3QucXVhdGVybmlvbi54LFxuICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgejogb2JqZWN0LnF1YXRlcm5pb24ueixcbiAgICAgICAgICB3OiBvYmplY3QucXVhdGVybmlvbi53XG4gICAgICAgIH07XG5cbiAgICAgICAgaWYgKGRhdGEud2lkdGgpIGRhdGEud2lkdGggKj0gb2JqZWN0LnNjYWxlLng7XG4gICAgICAgIGlmIChkYXRhLmhlaWdodCkgZGF0YS5oZWlnaHQgKj0gb2JqZWN0LnNjYWxlLnk7XG4gICAgICAgIGlmIChkYXRhLmRlcHRoKSBkYXRhLmRlcHRoICo9IG9iamVjdC5zY2FsZS56O1xuXG4gICAgICAgIHRoaXMuZXhlY3V0ZSgnYWRkT2JqZWN0JywgZGF0YSk7XG4gICAgICB9XG5cbiAgICAgIGNvbXBvbmVudC5lbWl0KCdwaHlzaWNzOmFkZGVkJyk7XG4gICAgfVxuICB9XG5cbiAgb25SZW1vdmVDYWxsYmFjayhjb21wb25lbnQpIHtcbiAgICBjb25zdCBvYmplY3QgPSBjb21wb25lbnQubmF0aXZlO1xuXG4gICAgaWYgKG9iamVjdCBpbnN0YW5jZW9mIFZlaGljbGUpIHtcbiAgICAgIHRoaXMuZXhlY3V0ZSgncmVtb3ZlVmVoaWNsZScsIHtpZDogb2JqZWN0Ll9waHlzaWpzLmlkfSk7XG4gICAgICB3aGlsZSAob2JqZWN0LndoZWVscy5sZW5ndGgpIHRoaXMucmVtb3ZlKG9iamVjdC53aGVlbHMucG9wKCkpO1xuXG4gICAgICB0aGlzLnJlbW92ZShvYmplY3QubWVzaCk7XG4gICAgICB0aGlzLnZlaGljbGVzW29iamVjdC5fcGh5c2lqcy5pZF0gPSBudWxsO1xuICAgIH0gZWxzZSB7XG4gICAgICAvLyBNZXNoLnByb3RvdHlwZS5yZW1vdmUuY2FsbCh0aGlzLCBvYmplY3QpO1xuXG4gICAgICBpZiAob2JqZWN0Ll9waHlzaWpzKSB7XG4gICAgICAgIGNvbXBvbmVudC5tYW5hZ2VyLnJlbW92ZSgnbW9kdWxlOndvcmxkJyk7XG4gICAgICAgIHRoaXMub2JqZWN0c1tvYmplY3QuX3BoeXNpanMuaWRdID0gbnVsbDtcbiAgICAgICAgdGhpcy5leGVjdXRlKCdyZW1vdmVPYmplY3QnLCB7aWQ6IG9iamVjdC5fcGh5c2lqcy5pZH0pO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGRlZmVyKGZ1bmMsIGFyZ3MpIHtcbiAgICByZXR1cm4gbmV3IFByb21pc2UoKHJlc29sdmUpID0+IHtcbiAgICAgIGlmICh0aGlzLmlzTG9hZGVkKSB7XG4gICAgICAgIGZ1bmMoLi4uYXJncyk7XG4gICAgICAgIHJlc29sdmUoKTtcbiAgICAgIH0gZWxzZSB0aGlzLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgICAgZnVuYyguLi5hcmdzKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuICAgIG1hbmFnZXIuc2V0KCdwaHlzaWNzV29ya2VyJywgdGhpcy53b3JrZXIpO1xuICB9XG5cbiAgYnJpZGdlID0ge1xuICAgIG9uQWRkKGNvbXBvbmVudCwgc2VsZikge1xuICAgICAgaWYgKGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKSkgcmV0dXJuIHNlbGYuZGVmZXIoc2VsZi5vbkFkZENhbGxiYWNrLmJpbmQoc2VsZiksIFtjb21wb25lbnRdKTtcbiAgICAgIHJldHVybjtcbiAgICB9LFxuXG4gICAgb25SZW1vdmUoY29tcG9uZW50LCBzZWxmKSB7XG4gICAgICBpZiAoY29tcG9uZW50LnVzZSgncGh5c2ljcycpKSByZXR1cm4gc2VsZi5kZWZlcihzZWxmLm9uUmVtb3ZlQ2FsbGJhY2suYmluZChzZWxmKSwgW2NvbXBvbmVudF0pO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgfTtcblxuICBpbnRlZ3JhdGUoc2VsZikge1xuICAgIC8vIC4uLlxuXG4gICAgdGhpcy5zZXRGaXhlZFRpbWVTdGVwID0gZnVuY3Rpb24oZml4ZWRUaW1lU3RlcCkge1xuICAgICAgaWYgKGZpeGVkVGltZVN0ZXApIHNlbGYuZXhlY3V0ZSgnc2V0Rml4ZWRUaW1lU3RlcCcsIGZpeGVkVGltZVN0ZXApO1xuICAgIH1cblxuICAgIHRoaXMuc2V0R3Jhdml0eSA9IGZ1bmN0aW9uKGdyYXZpdHkpIHtcbiAgICAgIGlmIChncmF2aXR5KSBzZWxmLmV4ZWN1dGUoJ3NldEdyYXZpdHknLCBncmF2aXR5KTtcbiAgICB9XG5cbiAgICB0aGlzLmFkZENvbnN0cmFpbnQgPSBzZWxmLmFkZENvbnN0cmFpbnQuYmluZChzZWxmKTtcblxuICAgIHRoaXMuc2ltdWxhdGUgPSBmdW5jdGlvbih0aW1lU3RlcCwgbWF4U3ViU3RlcHMpIHtcbiAgICAgIGlmIChzZWxmLl9zdGF0cykgc2VsZi5fc3RhdHMuYmVnaW4oKTtcblxuICAgICAgaWYgKHNlbGYuaXNTaW11bGF0aW5nKSByZXR1cm4gZmFsc2U7XG4gICAgICBzZWxmLmlzU2ltdWxhdGluZyA9IHRydWU7XG5cbiAgICAgIGZvciAoY29uc3Qgb2JqZWN0X2lkIGluIHNlbGYub2JqZWN0cykge1xuICAgICAgICBpZiAoIXNlbGYub2JqZWN0cy5oYXNPd25Qcm9wZXJ0eShvYmplY3RfaWQpKSBjb250aW51ZTtcblxuICAgICAgICBjb25zdCBvYmplY3QgPSBzZWxmLm9iamVjdHNbb2JqZWN0X2lkXTtcbiAgICAgICAgY29uc3QgY29tcG9uZW50ID0gb2JqZWN0LmNvbXBvbmVudDtcbiAgICAgICAgY29uc3QgZGF0YSA9IGNvbXBvbmVudC51c2UoJ3BoeXNpY3MnKS5kYXRhO1xuXG4gICAgICAgIGlmIChvYmplY3QgIT09IG51bGwgJiYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gfHwgY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikpIHtcbiAgICAgICAgICBjb25zdCB1cGRhdGUgPSB7aWQ6IGRhdGEuaWR9O1xuXG4gICAgICAgICAgaWYgKGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24pIHtcbiAgICAgICAgICAgIHVwZGF0ZS5wb3MgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5wb3NpdGlvbi54LFxuICAgICAgICAgICAgICB5OiBvYmplY3QucG9zaXRpb24ueSxcbiAgICAgICAgICAgICAgejogb2JqZWN0LnBvc2l0aW9uLnpcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5UG9zaXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBpZiAoY29tcG9uZW50Ll9fZGlydHlSb3RhdGlvbikge1xuICAgICAgICAgICAgdXBkYXRlLnF1YXQgPSB7XG4gICAgICAgICAgICAgIHg6IG9iamVjdC5xdWF0ZXJuaW9uLngsXG4gICAgICAgICAgICAgIHk6IG9iamVjdC5xdWF0ZXJuaW9uLnksXG4gICAgICAgICAgICAgIHo6IG9iamVjdC5xdWF0ZXJuaW9uLnosXG4gICAgICAgICAgICAgIHc6IG9iamVjdC5xdWF0ZXJuaW9uLndcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGlmIChkYXRhLmlzU29mdGJvZHkpIG9iamVjdC5yb3RhdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgICAgICAgICAgIGNvbXBvbmVudC5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBzZWxmLmV4ZWN1dGUoJ3VwZGF0ZVRyYW5zZm9ybScsIHVwZGF0ZSk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgc2VsZi5leGVjdXRlKCdzaW11bGF0ZScsIHt0aW1lU3RlcCwgbWF4U3ViU3RlcHN9KTtcblxuICAgICAgaWYgKHNlbGYuX3N0YXRzKSBzZWxmLl9zdGF0cy5lbmQoKTtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIC8vIGNvbnN0IHNpbXVsYXRlUHJvY2VzcyA9ICh0KSA9PiB7XG4gICAgLy8gICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHNpbXVsYXRlUHJvY2Vzcyk7XG5cbiAgICAvLyAgIHRoaXMuc2ltdWxhdGUoMS82MCwgMSk7IC8vIGRlbHRhLCAxXG4gICAgLy8gfVxuXG4gICAgLy8gc2ltdWxhdGVQcm9jZXNzKCk7XG5cbiAgICBzZWxmLmxvYWRlci50aGVuKCgpID0+IHtcbiAgICAgIHNlbGYuc2ltdWxhdGVMb29wID0gbmV3IExvb3AoKGNsb2NrKSA9PiB7XG4gICAgICAgIHRoaXMuc2ltdWxhdGUoY2xvY2suZ2V0RGVsdGEoKSwgMSk7IC8vIGRlbHRhLCAxXG4gICAgICB9KTtcblxuICAgICAgc2VsZi5zaW11bGF0ZUxvb3Auc3RhcnQodGhpcyk7XG5cbiAgICAgIGNvbnNvbGUubG9nKHNlbGYub3B0aW9ucy5ncmF2aXR5KTtcbiAgICAgIHRoaXMuc2V0R3Jhdml0eShzZWxmLm9wdGlvbnMuZ3Jhdml0eSk7XG4gICAgfSk7XG4gIH1cbn1cbiIsInZhciBUQVJHRVQgPSB0eXBlb2YgU3ltYm9sID09PSAndW5kZWZpbmVkJyA/ICdfX3RhcmdldCcgOiBTeW1ib2woKSxcbiAgICBTQ1JJUFRfVFlQRSA9ICdhcHBsaWNhdGlvbi9qYXZhc2NyaXB0JyxcbiAgICBCbG9iQnVpbGRlciA9IHdpbmRvdy5CbG9iQnVpbGRlciB8fCB3aW5kb3cuV2ViS2l0QmxvYkJ1aWxkZXIgfHwgd2luZG93Lk1vekJsb2JCdWlsZGVyIHx8IHdpbmRvdy5NU0Jsb2JCdWlsZGVyLFxuICAgIFVSTCA9IHdpbmRvdy5VUkwgfHwgd2luZG93LndlYmtpdFVSTCxcbiAgICBXb3JrZXIgPSB3aW5kb3cuV29ya2VyO1xuXG4vKipcbiAqIFJldHVybnMgYSB3cmFwcGVyIGFyb3VuZCBXZWIgV29ya2VyIGNvZGUgdGhhdCBpcyBjb25zdHJ1Y3RpYmxlLlxuICpcbiAqIEBmdW5jdGlvbiBzaGltV29ya2VyXG4gKlxuICogQHBhcmFtIHsgU3RyaW5nIH0gICAgZmlsZW5hbWUgICAgVGhlIG5hbWUgb2YgdGhlIGZpbGVcbiAqIEBwYXJhbSB7IEZ1bmN0aW9uIH0gIGZuICAgICAgICAgIEZ1bmN0aW9uIHdyYXBwaW5nIHRoZSBjb2RlIG9mIHRoZSB3b3JrZXJcbiAqL1xuZXhwb3J0IGRlZmF1bHQgZnVuY3Rpb24gc2hpbVdvcmtlciAoZmlsZW5hbWUsIGZuKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uIFNoaW1Xb3JrZXIgKGZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgdmFyIG8gPSB0aGlzO1xuXG4gICAgICAgIGlmICghZm4pIHtcbiAgICAgICAgICAgIHJldHVybiBuZXcgV29ya2VyKGZpbGVuYW1lKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChXb3JrZXIgJiYgIWZvcmNlRmFsbGJhY2spIHtcbiAgICAgICAgICAgIC8vIENvbnZlcnQgdGhlIGZ1bmN0aW9uJ3MgaW5uZXIgY29kZSB0byBhIHN0cmluZyB0byBjb25zdHJ1Y3QgdGhlIHdvcmtlclxuICAgICAgICAgICAgdmFyIHNvdXJjZSA9IGZuLnRvU3RyaW5nKCkucmVwbGFjZSgvXmZ1bmN0aW9uLis/ey8sICcnKS5zbGljZSgwLCAtMSksXG4gICAgICAgICAgICAgICAgb2JqVVJMID0gY3JlYXRlU291cmNlT2JqZWN0KHNvdXJjZSk7XG5cbiAgICAgICAgICAgIHRoaXNbVEFSR0VUXSA9IG5ldyBXb3JrZXIob2JqVVJMKTtcbiAgICAgICAgICAgIFVSTC5yZXZva2VPYmplY3RVUkwob2JqVVJMKTtcbiAgICAgICAgICAgIHJldHVybiB0aGlzW1RBUkdFVF07XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB2YXIgc2VsZlNoaW0gPSB7XG4gICAgICAgICAgICAgICAgICAgIHBvc3RNZXNzYWdlOiBmdW5jdGlvbihtKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoby5vbm1lc3NhZ2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IG8ub25tZXNzYWdlKHsgZGF0YTogbSwgdGFyZ2V0OiBzZWxmU2hpbSB9KSB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIGZuLmNhbGwoc2VsZlNoaW0pO1xuICAgICAgICAgICAgdGhpcy5wb3N0TWVzc2FnZSA9IGZ1bmN0aW9uKG0pIHtcbiAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7IHNlbGZTaGltLm9ubWVzc2FnZSh7IGRhdGE6IG0sIHRhcmdldDogbyB9KSB9KTtcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICB0aGlzLmlzVGhpc1RocmVhZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICB9O1xufTtcblxuLy8gVGVzdCBXb3JrZXIgY2FwYWJpbGl0aWVzXG5pZiAoV29ya2VyKSB7XG4gICAgdmFyIHRlc3RXb3JrZXIsXG4gICAgICAgIG9ialVSTCA9IGNyZWF0ZVNvdXJjZU9iamVjdCgnc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoKSB7fScpLFxuICAgICAgICB0ZXN0QXJyYXkgPSBuZXcgVWludDhBcnJheSgxKTtcblxuICAgIHRyeSB7XG4gICAgICAgIC8vIE5vIHdvcmtlcnMgdmlhIGJsb2JzIGluIEVkZ2UgMTIgYW5kIElFIDExIGFuZCBsb3dlciA6KFxuICAgICAgICBpZiAoLyg/OlRyaWRlbnR8RWRnZSlcXC8oPzpbNTY3XXwxMikvaS50ZXN0KG5hdmlnYXRvci51c2VyQWdlbnQpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ05vdCBhdmFpbGFibGUnKTtcbiAgICAgICAgfVxuICAgICAgICB0ZXN0V29ya2VyID0gbmV3IFdvcmtlcihvYmpVUkwpO1xuXG4gICAgICAgIC8vIE5hdGl2ZSBicm93c2VyIG9uIHNvbWUgU2Ftc3VuZyBkZXZpY2VzIHRocm93cyBmb3IgdHJhbnNmZXJhYmxlcywgbGV0J3MgZGV0ZWN0IGl0XG4gICAgICAgIHRlc3RXb3JrZXIucG9zdE1lc3NhZ2UodGVzdEFycmF5LCBbdGVzdEFycmF5LmJ1ZmZlcl0pO1xuICAgIH1cbiAgICBjYXRjaCAoZSkge1xuICAgICAgICBXb3JrZXIgPSBudWxsO1xuICAgIH1cbiAgICBmaW5hbGx5IHtcbiAgICAgICAgVVJMLnJldm9rZU9iamVjdFVSTChvYmpVUkwpO1xuICAgICAgICBpZiAodGVzdFdvcmtlcikge1xuICAgICAgICAgICAgdGVzdFdvcmtlci50ZXJtaW5hdGUoKTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxuZnVuY3Rpb24gY3JlYXRlU291cmNlT2JqZWN0KHN0cikge1xuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBVUkwuY3JlYXRlT2JqZWN0VVJMKG5ldyBCbG9iKFtzdHJdLCB7IHR5cGU6IFNDUklQVF9UWVBFIH0pKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYkJ1aWxkZXIoKTtcbiAgICAgICAgYmxvYi5hcHBlbmQoc3RyKTtcbiAgICAgICAgcmV0dXJuIFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYi5nZXRCbG9iKHR5cGUpKTtcbiAgICB9XG59XG4iLCJpbXBvcnQgc2hpbVdvcmtlciBmcm9tICdyb2xsdXAtcGx1Z2luLWJ1bmRsZS13b3JrZXInO1xuZXhwb3J0IGRlZmF1bHQgbmV3IHNoaW1Xb3JrZXIoXCIuLi93b3JrZXIuanNcIiwgZnVuY3Rpb24gKHdpbmRvdywgZG9jdW1lbnQpIHtcbnZhciBzZWxmID0gdGhpcztcbmZ1bmN0aW9uIEV2ZW50cyh0YXJnZXQpIHtcbiAgdmFyIGV2ZW50cyA9IHt9LFxuICAgIGVtcHR5ID0gW107XG4gIHRhcmdldCA9IHRhcmdldCB8fCB0aGlzXG4gIC8qKlxuICAgKiAgT246IGxpc3RlbiB0byBldmVudHNcbiAgICovXG4gIHRhcmdldC5vbiA9IGZ1bmN0aW9uICh0eXBlLCBmdW5jLCBjdHgpIHtcbiAgICAoZXZlbnRzW3R5cGVdID0gZXZlbnRzW3R5cGVdIHx8IFtdKS5wdXNoKFtmdW5jLCBjdHhdKVxuICAgIHJldHVybiB0YXJnZXRcbiAgfVxuICAvKipcbiAgICogIE9mZjogc3RvcCBsaXN0ZW5pbmcgdG8gZXZlbnQgLyBzcGVjaWZpYyBjYWxsYmFja1xuICAgKi9cbiAgdGFyZ2V0Lm9mZiA9IGZ1bmN0aW9uICh0eXBlLCBmdW5jKSB7XG4gICAgdHlwZSB8fCAoZXZlbnRzID0ge30pXG4gICAgdmFyIGxpc3QgPSBldmVudHNbdHlwZV0gfHwgZW1wdHksXG4gICAgICBpID0gbGlzdC5sZW5ndGggPSBmdW5jID8gbGlzdC5sZW5ndGggOiAwO1xuICAgIHdoaWxlIChpLS0pIGZ1bmMgPT0gbGlzdFtpXVswXSAmJiBsaXN0LnNwbGljZShpLCAxKVxuICAgIHJldHVybiB0YXJnZXRcbiAgfVxuICAvKipcbiAgICogRW1pdDogc2VuZCBldmVudCwgY2FsbGJhY2tzIHdpbGwgYmUgdHJpZ2dlcmVkXG4gICAqL1xuICB0YXJnZXQuZW1pdCA9IGZ1bmN0aW9uICh0eXBlKSB7XG4gICAgdmFyIGUgPSBldmVudHNbdHlwZV0gfHwgZW1wdHksXG4gICAgICBsaXN0ID0gZS5sZW5ndGggPiAwID8gZS5zbGljZSgwLCBlLmxlbmd0aCkgOiBlLFxuICAgICAgaSA9IDAsXG4gICAgICBqO1xuICAgIHdoaWxlIChqID0gbGlzdFtpKytdKSBqWzBdLmFwcGx5KGpbMV0sIGVtcHR5LnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSlcbiAgICByZXR1cm4gdGFyZ2V0XG4gIH07XG59O1xuXG5jb25zdCBpbnNpZGVXb3JrZXIgPSAhc2VsZi5kb2N1bWVudDtcbmlmICghaW5zaWRlV29ya2VyKSBzZWxmID0gbmV3IEV2ZW50cygpO1xuXG5sZXQgc2VuZCA9IGluc2lkZVdvcmtlciA/IChzZWxmLndlYmtpdFBvc3RNZXNzYWdlIHx8IHNlbGYucG9zdE1lc3NhZ2UpIDogZnVuY3Rpb24gKGRhdGEpIHtcbiAgc2VsZi5lbWl0KCdtZXNzYWdlJywgeyBkYXRhIH0pO1xufTtcblxuc2VsZi5zZW5kID0gc2VuZDtcblxubGV0IFNVUFBPUlRfVFJBTlNGRVJBQkxFO1xuXG5pZiAoaW5zaWRlV29ya2VyKSB7XG4gIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuXG4gIHNlbmQoYWIsIFthYl0pO1xuICBTVVBQT1JUX1RSQU5TRkVSQUJMRSA9IChhYi5ieXRlTGVuZ3RoID09PSAwKTtcbn1cblxuY29uc3QgTUVTU0FHRV9UWVBFUyA9IHtcbiAgV09STERSRVBPUlQ6IDAsXG4gIENPTExJU0lPTlJFUE9SVDogMSxcbiAgVkVISUNMRVJFUE9SVDogMixcbiAgQ09OU1RSQUlOVFJFUE9SVDogMyxcbiAgU09GVFJFUE9SVDogNFxufTtcblxuLy8gdGVtcCB2YXJpYWJsZXNcbmxldCBfb2JqZWN0LFxuICBfdmVjdG9yLFxuICBfdHJhbnNmb3JtLFxuICBfdHJhbnNmb3JtX3BvcyxcbiAgX3NvZnRib2R5X2VuYWJsZWQgPSBmYWxzZSxcbiAgbGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uID0gMCxcblxuICBfbnVtX29iamVjdHMgPSAwLFxuICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzID0gMCxcbiAgX251bV9zb2Z0Ym9keV9vYmplY3RzID0gMCxcbiAgX251bV93aGVlbHMgPSAwLFxuICBfbnVtX2NvbnN0cmFpbnRzID0gMCxcbiAgX3NvZnRib2R5X3JlcG9ydF9zaXplID0gMCxcblxuICAvLyB3b3JsZCB2YXJpYWJsZXNcbiAgZml4ZWRUaW1lU3RlcCwgLy8gdXNlZCB3aGVuIGNhbGxpbmcgc3RlcFNpbXVsYXRpb25cbiAgbGFzdF9zaW11bGF0aW9uX3RpbWUsXG5cbiAgd29ybGQsXG4gIF92ZWMzXzEsXG4gIF92ZWMzXzIsXG4gIF92ZWMzXzMsXG4gIF9xdWF0O1xuXG4vLyBwcml2YXRlIGNhY2hlXG5jb25zdCBwdWJsaWNfZnVuY3Rpb25zID0ge30sXG4gIF9vYmplY3RzID0gW10sXG4gIF92ZWhpY2xlcyA9IFtdLFxuICBfY29uc3RyYWludHMgPSBbXSxcbiAgX29iamVjdHNfYW1tbyA9IHt9LFxuICBfb2JqZWN0X3NoYXBlcyA9IHt9LFxuXG4gIC8vIFRoZSBmb2xsb3dpbmcgb2JqZWN0cyBhcmUgdG8gdHJhY2sgb2JqZWN0cyB0aGF0IGFtbW8uanMgZG9lc24ndCBjbGVhblxuICAvLyB1cC4gQWxsIGFyZSBjbGVhbmVkIHVwIHdoZW4gdGhleSdyZSBjb3JyZXNwb25kaW5nIGJvZHkgaXMgZGVzdHJveWVkLlxuICAvLyBVbmZvcnR1bmF0ZWx5LCBpdCdzIHZlcnkgZGlmZmljdWx0IHRvIGdldCBhdCB0aGVzZSBvYmplY3RzIGZyb20gdGhlXG4gIC8vIGJvZHksIHNvIHdlIGhhdmUgdG8gdHJhY2sgdGhlbSBvdXJzZWx2ZXMuXG4gIF9tb3Rpb25fc3RhdGVzID0ge30sXG4gIC8vIERvbid0IG5lZWQgdG8gd29ycnkgYWJvdXQgaXQgZm9yIGNhY2hlZCBzaGFwZXMuXG4gIF9ub25jYWNoZWRfc2hhcGVzID0ge30sXG4gIC8vIEEgYm9keSB3aXRoIGEgY29tcG91bmQgc2hhcGUgYWx3YXlzIGhhcyBhIHJlZ3VsYXIgc2hhcGUgYXMgd2VsbCwgc28gd2VcbiAgLy8gaGF2ZSB0cmFjayB0aGVtIHNlcGFyYXRlbHkuXG4gIF9jb21wb3VuZF9zaGFwZXMgPSB7fTtcblxuLy8gb2JqZWN0IHJlcG9ydGluZ1xubGV0IFJFUE9SVF9DSFVOS1NJWkUsIC8vIHJlcG9ydCBhcnJheSBpcyBpbmNyZWFzZWQgaW4gaW5jcmVtZW50cyBvZiB0aGlzIGNodW5rIHNpemVcbiAgd29ybGRyZXBvcnQsXG4gIHNvZnRyZXBvcnQsXG4gIGNvbGxpc2lvbnJlcG9ydCxcbiAgdmVoaWNsZXJlcG9ydCxcbiAgY29uc3RyYWludHJlcG9ydDtcblxuY29uc3QgV09STERSRVBPUlRfSVRFTVNJWkUgPSAxNCwgLy8gaG93IG1hbnkgZmxvYXQgdmFsdWVzIGVhY2ggcmVwb3J0ZWQgaXRlbSBuZWVkc1xuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUgPSA1LCAvLyBvbmUgZmxvYXQgZm9yIGVhY2ggb2JqZWN0IGlkLCBhbmQgYSBWZWMzIGNvbnRhY3Qgbm9ybWFsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgPSA5LCAvLyB2ZWhpY2xlIGlkLCB3aGVlbCBpbmRleCwgMyBmb3IgcG9zaXRpb24sIDQgZm9yIHJvdGF0aW9uXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUgPSA2OyAvLyBjb25zdHJhaW50IGlkLCBvZmZzZXQgb2JqZWN0LCBvZmZzZXQsIGFwcGxpZWQgaW1wdWxzZVxuXG5jb25zdCBnZXRTaGFwZUZyb21DYWNoZSA9IChjYWNoZV9rZXkpID0+IHtcbiAgaWYgKF9vYmplY3Rfc2hhcGVzW2NhY2hlX2tleV0gIT09IHVuZGVmaW5lZClcbiAgICByZXR1cm4gX29iamVjdF9zaGFwZXNbY2FjaGVfa2V5XTtcblxuICByZXR1cm4gbnVsbDtcbn07XG5cbmNvbnN0IHNldFNoYXBlQ2FjaGUgPSAoY2FjaGVfa2V5LCBzaGFwZSkgPT4ge1xuICBfb2JqZWN0X3NoYXBlc1tjYWNoZV9rZXldID0gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTaGFwZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgc2hhcGU7XG5cbiAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuICBzd2l0Y2ggKGRlc2NyaXB0aW9uLnR5cGUpIHtcbiAgY2FzZSAnY29tcG91bmQnOlxuICAgIHtcbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAncGxhbmUnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBwbGFuZV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC54fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC55fV8ke2Rlc2NyaXB0aW9uLm5vcm1hbC56fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ubm9ybWFsLngpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ubm9ybWFsLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24ubm9ybWFsLnopO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3RhdGljUGxhbmVTaGFwZShfdmVjM18xLCAwKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdib3gnOlxuICAgIHtcbiAgICAgIGNvbnN0IGNhY2hlX2tleSA9IGBib3hfJHtkZXNjcmlwdGlvbi53aWR0aH1fJHtkZXNjcmlwdGlvbi5oZWlnaHR9XyR7ZGVzY3JpcHRpb24uZGVwdGh9YDtcblxuICAgICAgaWYgKChzaGFwZSA9IGdldFNoYXBlRnJvbUNhY2hlKGNhY2hlX2tleSkpID09PSBudWxsKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi53aWR0aCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uaGVpZ2h0IC8gMik7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi5kZXB0aCAvIDIpO1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Qm94U2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnc3BoZXJlJzpcbiAgICB7XG4gICAgICBjb25zdCBjYWNoZV9rZXkgPSBgc3BoZXJlXyR7ZGVzY3JpcHRpb24ucmFkaXVzfWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0U3BoZXJlU2hhcGUoZGVzY3JpcHRpb24ucmFkaXVzKTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjeWxpbmRlcic6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGN5bGluZGVyXyR7ZGVzY3JpcHRpb24ud2lkdGh9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fV8ke2Rlc2NyaXB0aW9uLmRlcHRofWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24ud2lkdGggLyAyKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRlc2NyaXB0aW9uLmhlaWdodCAvIDIpO1xuICAgICAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uZGVwdGggLyAyKTtcbiAgICAgICAgc2hhcGUgPSBuZXcgQW1tby5idEN5bGluZGVyU2hhcGUoX3ZlYzNfMSk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY2Fwc3VsZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNhcHN1bGVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICAvLyBJbiBCdWxsZXQsIGNhcHN1bGUgaGVpZ2h0IGV4Y2x1ZGVzIHRoZSBlbmQgc3BoZXJlc1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q2Fwc3VsZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0IC0gMiAqIGRlc2NyaXB0aW9uLnJhZGl1cyk7XG4gICAgICAgIHNldFNoYXBlQ2FjaGUoY2FjaGVfa2V5LCBzaGFwZSk7XG4gICAgICB9XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29uZSc6XG4gICAge1xuICAgICAgY29uc3QgY2FjaGVfa2V5ID0gYGNvbmVfJHtkZXNjcmlwdGlvbi5yYWRpdXN9XyR7ZGVzY3JpcHRpb24uaGVpZ2h0fWA7XG5cbiAgICAgIGlmICgoc2hhcGUgPSBnZXRTaGFwZUZyb21DYWNoZShjYWNoZV9rZXkpKSA9PT0gbnVsbCkge1xuICAgICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0Q29uZVNoYXBlKGRlc2NyaXB0aW9uLnJhZGl1cywgZGVzY3JpcHRpb24uaGVpZ2h0KTtcbiAgICAgICAgc2V0U2hhcGVDYWNoZShjYWNoZV9rZXksIHNoYXBlKTtcbiAgICAgIH1cblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdjb25jYXZlJzpcbiAgICB7XG4gICAgICBjb25zdCB0cmlhbmdsZV9tZXNoID0gbmV3IEFtbW8uYnRUcmlhbmdsZU1lc2goKTtcbiAgICAgIGlmICghZGVzY3JpcHRpb24uZGF0YS5sZW5ndGgpIHJldHVybiBmYWxzZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBkZXNjcmlwdGlvbi5kYXRhO1xuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGRhdGEubGVuZ3RoIC8gOTsgaSsrKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkYXRhW2kgKiA5XSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShkYXRhW2kgKiA5ICsgMV0pO1xuICAgICAgICBfdmVjM18xLnNldFooZGF0YVtpICogOSArIDJdKTtcblxuICAgICAgICBfdmVjM18yLnNldFgoZGF0YVtpICogOSArIDNdKTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRhdGFbaSAqIDkgKyA0XSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkYXRhW2kgKiA5ICsgNV0pO1xuXG4gICAgICAgIF92ZWMzXzMuc2V0WChkYXRhW2kgKiA5ICsgNl0pO1xuICAgICAgICBfdmVjM18zLnNldFkoZGF0YVtpICogOSArIDddKTtcbiAgICAgICAgX3ZlYzNfMy5zZXRaKGRhdGFbaSAqIDkgKyA4XSk7XG5cbiAgICAgICAgdHJpYW5nbGVfbWVzaC5hZGRUcmlhbmdsZShcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzIsXG4gICAgICAgICAgX3ZlYzNfMyxcbiAgICAgICAgICBmYWxzZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzaGFwZSA9IG5ldyBBbW1vLmJ0QnZoVHJpYW5nbGVNZXNoU2hhcGUoXG4gICAgICAgIHRyaWFuZ2xlX21lc2gsXG4gICAgICAgIHRydWUsXG4gICAgICAgIHRydWVcbiAgICAgICk7XG5cbiAgICAgIF9ub25jYWNoZWRfc2hhcGVzW2Rlc2NyaXB0aW9uLmlkXSA9IHNoYXBlO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ2NvbnZleCc6XG4gICAge1xuICAgICAgc2hhcGUgPSBuZXcgQW1tby5idENvbnZleEh1bGxTaGFwZSgpO1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YS5sZW5ndGggLyAzOyBpKyspIHtcbiAgICAgICAgX3ZlYzNfMS5zZXRYKGRhdGFbaSAqIDNdKTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRhdGFbaSAqIDMgKyAxXSk7XG4gICAgICAgIF92ZWMzXzEuc2V0WihkYXRhW2kgKiAzICsgMl0pO1xuXG4gICAgICAgIHNoYXBlLmFkZFBvaW50KF92ZWMzXzEpO1xuICAgICAgfVxuXG4gICAgICBfbm9uY2FjaGVkX3NoYXBlc1tkZXNjcmlwdGlvbi5pZF0gPSBzaGFwZTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdoZWlnaHRmaWVsZCc6XG4gICAge1xuICAgICAgY29uc3QgeHB0cyA9IGRlc2NyaXB0aW9uLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkZXNjcmlwdGlvbi55cHRzLFxuICAgICAgICBwb2ludHMgPSBkZXNjcmlwdGlvbi5wb2ludHMsXG4gICAgICAgIHB0ciA9IEFtbW8uX21hbGxvYyg0ICogeHB0cyAqIHlwdHMpO1xuXG4gICAgICBmb3IgKGxldCBpID0gMCwgcCA9IDAsIHAyID0gMDsgaSA8IHhwdHM7IGkrKykge1xuICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IHlwdHM7IGorKykge1xuICAgICAgICAgIEFtbW8uSEVBUEYzMltwdHIgKyBwMiA+PiAyXSA9IHBvaW50c1twXTtcblxuICAgICAgICAgIHArKztcbiAgICAgICAgICBwMiArPSA0O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIHNoYXBlID0gbmV3IEFtbW8uYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZShcbiAgICAgICAgZGVzY3JpcHRpb24ueHB0cyxcbiAgICAgICAgZGVzY3JpcHRpb24ueXB0cyxcbiAgICAgICAgcHRyLFxuICAgICAgICAxLCAtZGVzY3JpcHRpb24uYWJzTWF4SGVpZ2h0LFxuICAgICAgICBkZXNjcmlwdGlvbi5hYnNNYXhIZWlnaHQsXG4gICAgICAgIDEsXG4gICAgICAgICdQSFlfRkxPQVQnLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgX25vbmNhY2hlZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgICBicmVhaztcbiAgICB9XG4gIGRlZmF1bHQ6XG4gICAgLy8gTm90IHJlY29nbml6ZWRcbiAgICByZXR1cm47XG4gIH1cblxuICByZXR1cm4gc2hhcGU7XG59O1xuXG5jb25zdCBjcmVhdGVTb2Z0Qm9keSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBsZXQgYm9keTtcblxuICBjb25zdCBzb2Z0Qm9keUhlbHBlcnMgPSBuZXcgQW1tby5idFNvZnRCb2R5SGVscGVycygpO1xuXG4gIHN3aXRjaCAoZGVzY3JpcHRpb24udHlwZSkge1xuICBjYXNlICdzb2Z0VHJpbWVzaCc6XG4gICAge1xuICAgICAgaWYgKCFkZXNjcmlwdGlvbi5hVmVydGljZXMubGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlRnJvbVRyaU1lc2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBkZXNjcmlwdGlvbi5hVmVydGljZXMsXG4gICAgICAgIGRlc2NyaXB0aW9uLmFJbmRpY2VzLFxuICAgICAgICBkZXNjcmlwdGlvbi5hSW5kaWNlcy5sZW5ndGggLyAzLFxuICAgICAgICBmYWxzZVxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzb2Z0Q2xvdGhNZXNoJzpcbiAgICB7XG4gICAgICBjb25zdCBjciA9IGRlc2NyaXB0aW9uLmNvcm5lcnM7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUGF0Y2goXG4gICAgICAgIHdvcmxkLmdldFdvcmxkSW5mbygpLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbMF0sIGNyWzFdLCBjclsyXSksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhjclszXSwgY3JbNF0sIGNyWzVdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGNyWzZdLCBjcls3XSwgY3JbOF0pLFxuICAgICAgICBuZXcgQW1tby5idFZlY3RvcjMoY3JbOV0sIGNyWzEwXSwgY3JbMTFdKSxcbiAgICAgICAgZGVzY3JpcHRpb24uc2VnbWVudHNbMF0sXG4gICAgICAgIGRlc2NyaXB0aW9uLnNlZ21lbnRzWzFdLFxuICAgICAgICAwLFxuICAgICAgICB0cnVlXG4gICAgICApO1xuXG4gICAgICBicmVhaztcbiAgICB9XG4gIGNhc2UgJ3NvZnRSb3BlTWVzaCc6XG4gICAge1xuICAgICAgY29uc3QgZGF0YSA9IGRlc2NyaXB0aW9uLmRhdGE7XG5cbiAgICAgIGJvZHkgPSBzb2Z0Qm9keUhlbHBlcnMuQ3JlYXRlUm9wZShcbiAgICAgICAgd29ybGQuZ2V0V29ybGRJbmZvKCksXG4gICAgICAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhkYXRhWzBdLCBkYXRhWzFdLCBkYXRhWzJdKSxcbiAgICAgICAgbmV3IEFtbW8uYnRWZWN0b3IzKGRhdGFbM10sIGRhdGFbNF0sIGRhdGFbNV0pLFxuICAgICAgICBkYXRhWzZdIC0gMSxcbiAgICAgICAgMFxuICAgICAgKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIC8vIE5vdCByZWNvZ25pemVkXG4gICAgcmV0dXJuO1xuICB9XG5cbiAgcmV0dXJuIGJvZHk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmluaXQgPSAocGFyYW1zID0ge30pID0+IHtcbiAgaWYgKHBhcmFtcy5ub1dvcmtlcikge1xuICAgIHdpbmRvdy5BbW1vID0gbmV3IHBhcmFtcy5hbW1vKCk7XG4gICAgcHVibGljX2Z1bmN0aW9ucy5tYWtlV29ybGQocGFyYW1zKTtcbiAgICByZXR1cm47XG4gIH1cblxuICBpZiAocGFyYW1zLndhc21CdWZmZXIpIHtcbiAgICBpbXBvcnRTY3JpcHRzKHBhcmFtcy5hbW1vKTtcblxuICAgIHNlbGYuQW1tbyA9IG5ldyBsb2FkQW1tb0Zyb21CaW5hcnkocGFyYW1zLndhc21CdWZmZXIpKCk7XG4gICAgc2VuZCh7IGNtZDogJ2FtbW9Mb2FkZWQnIH0pO1xuICAgIHB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkKHBhcmFtcyk7XG4gIH1cbiAgZWxzZSB7XG4gICAgaW1wb3J0U2NyaXB0cyhwYXJhbXMuYW1tbyk7XG4gICAgc2VuZCh7IGNtZDogJ2FtbW9Mb2FkZWQnIH0pO1xuXG4gICAgc2VsZi5BbW1vID0gbmV3IEFtbW8oKTtcbiAgICBwdWJsaWNfZnVuY3Rpb25zLm1ha2VXb3JsZChwYXJhbXMpO1xuICB9XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubWFrZVdvcmxkID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIF90cmFuc2Zvcm0gPSBuZXcgQW1tby5idFRyYW5zZm9ybSgpO1xuICBfdHJhbnNmb3JtX3BvcyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gIF92ZWMzXzEgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzIgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF92ZWMzXzMgPSBuZXcgQW1tby5idFZlY3RvcjMoMCwgMCwgMCk7XG4gIF9xdWF0ID0gbmV3IEFtbW8uYnRRdWF0ZXJuaW9uKDAsIDAsIDAsIDApO1xuXG4gIFJFUE9SVF9DSFVOS1NJWkUgPSBwYXJhbXMucmVwb3J0c2l6ZSB8fCA1MDtcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICAvLyBUcmFuc2ZlcmFibGUgbWVzc2FnZXMgYXJlIHN1cHBvcnRlZCwgdGFrZSBhZHZhbnRhZ2Ugb2YgdGhlbSB3aXRoIFR5cGVkQXJyYXlzXG4gICAgd29ybGRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogV09STERSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiBvYmplY3RzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIENPTExJU0lPTlJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbGxpc2lvbnMgdG8gcmVwb3J0ICsgY2h1bmsgc2l6ZSAqICMgb2YgdmFsdWVzIHBlciBvYmplY3RcbiAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgyICsgUkVQT1JUX0NIVU5LU0laRSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICsgIyBvZiB2ZWhpY2xlcyB0byByZXBvcnQgKyBjaHVuayBzaXplICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdFxuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KDIgKyBSRVBPUlRfQ0hVTktTSVpFICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgKyAjIG9mIGNvbnN0cmFpbnRzIHRvIHJlcG9ydCArIGNodW5rIHNpemUgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0XG4gIH1cbiAgZWxzZSB7XG4gICAgLy8gVHJhbnNmZXJhYmxlIG1lc3NhZ2VzIGFyZSBub3Qgc3VwcG9ydGVkLCBzZW5kIGRhdGEgYXMgbm9ybWFsIGFycmF5c1xuICAgIHdvcmxkcmVwb3J0ID0gW107XG4gICAgY29sbGlzaW9ucmVwb3J0ID0gW107XG4gICAgdmVoaWNsZXJlcG9ydCA9IFtdO1xuICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBbXTtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgY29sbGlzaW9ucmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ7XG4gIHZlaGljbGVyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlQ7XG4gIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG5cbiAgY29uc3QgY29sbGlzaW9uQ29uZmlndXJhdGlvbiA9IHBhcmFtcy5zb2Z0Ym9keSA/XG4gICAgbmV3IEFtbW8uYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24oKSA6XG4gICAgbmV3IEFtbW8uYnREZWZhdWx0Q29sbGlzaW9uQ29uZmlndXJhdGlvbigpLFxuICAgIGRpc3BhdGNoZXIgPSBuZXcgQW1tby5idENvbGxpc2lvbkRpc3BhdGNoZXIoY29sbGlzaW9uQ29uZmlndXJhdGlvbiksXG4gICAgc29sdmVyID0gbmV3IEFtbW8uYnRTZXF1ZW50aWFsSW1wdWxzZUNvbnN0cmFpbnRTb2x2ZXIoKTtcblxuICBsZXQgYnJvYWRwaGFzZTtcblxuICBpZiAoIXBhcmFtcy5icm9hZHBoYXNlKSBwYXJhbXMuYnJvYWRwaGFzZSA9IHsgdHlwZTogJ2R5bmFtaWMnIH07XG4gIC8vIFRPRE8hISFcbiAgLyogaWYgKHBhcmFtcy5icm9hZHBoYXNlLnR5cGUgPT09ICdzd2VlcHBydW5lJykge1xuICAgIGV4dGVuZChwYXJhbXMuYnJvYWRwaGFzZSwge1xuICAgICAgYWFiYm1pbjoge1xuICAgICAgICB4OiAtNTAsXG4gICAgICAgIHk6IC01MCxcbiAgICAgICAgejogLTUwXG4gICAgICB9LFxuXG4gICAgICBhYWJibWF4OiB7XG4gICAgICAgIHg6IDUwLFxuICAgICAgICB5OiA1MCxcbiAgICAgICAgejogNTBcbiAgICAgIH0sXG4gICAgfSk7XG4gIH0qL1xuXG4gIHN3aXRjaCAocGFyYW1zLmJyb2FkcGhhc2UudHlwZSkge1xuICBjYXNlICdzd2VlcHBydW5lJzpcbiAgICBfdmVjM18xLnNldFgocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi54KTtcbiAgICBfdmVjM18xLnNldFkocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi55KTtcbiAgICBfdmVjM18xLnNldFoocGFyYW1zLmJyb2FkcGhhc2UuYWFiYm1pbi56KTtcblxuICAgIF92ZWMzXzIuc2V0WChwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LngpO1xuICAgIF92ZWMzXzIuc2V0WShwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnkpO1xuICAgIF92ZWMzXzIuc2V0WihwYXJhbXMuYnJvYWRwaGFzZS5hYWJibWF4LnopO1xuXG4gICAgYnJvYWRwaGFzZSA9IG5ldyBBbW1vLmJ0QXhpc1N3ZWVwMyhcbiAgICAgIF92ZWMzXzEsXG4gICAgICBfdmVjM18yXG4gICAgKTtcblxuICAgIGJyZWFrO1xuICBjYXNlICdkeW5hbWljJzpcbiAgZGVmYXVsdDpcbiAgICBicm9hZHBoYXNlID0gbmV3IEFtbW8uYnREYnZ0QnJvYWRwaGFzZSgpO1xuICAgIGJyZWFrO1xuICB9XG5cbiAgd29ybGQgPSBwYXJhbXMuc29mdGJvZHkgP1xuICAgIG5ldyBBbW1vLmJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24sIG5ldyBBbW1vLmJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyKCkpIDpcbiAgICBuZXcgQW1tby5idERpc2NyZXRlRHluYW1pY3NXb3JsZChkaXNwYXRjaGVyLCBicm9hZHBoYXNlLCBzb2x2ZXIsIGNvbGxpc2lvbkNvbmZpZ3VyYXRpb24pO1xuICBmaXhlZFRpbWVTdGVwID0gcGFyYW1zLmZpeGVkVGltZVN0ZXA7XG5cbiAgaWYgKHBhcmFtcy5zb2Z0Ym9keSkgX3NvZnRib2R5X2VuYWJsZWQgPSB0cnVlO1xuXG4gIHNlbmQoeyBjbWQ6ICd3b3JsZFJlYWR5JyB9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0Rml4ZWRUaW1lU3RlcCA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBmaXhlZFRpbWVTdGVwID0gZGVzY3JpcHRpb247XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEdyYXZpdHkgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLngpO1xuICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ueSk7XG4gIF92ZWMzXzEuc2V0WihkZXNjcmlwdGlvbi56KTtcbiAgd29ybGQuc2V0R3Jhdml0eShfdmVjM18xKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kQW5jaG9yID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9ial1cbiAgICAuYXBwZW5kQW5jaG9yKFxuICAgICAgZGVzY3JpcHRpb24ubm9kZSxcbiAgICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLm9iajJdLFxuICAgICAgZGVzY3JpcHRpb24uY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyxcbiAgICAgIGRlc2NyaXB0aW9uLmluZmx1ZW5jZVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMubGlua05vZGVzID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIHZhciBzZWxmX2JvZHkgPSBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXTtcbiAgdmFyIG90aGVyX2JvZHkgPSBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XTtcblxuICB2YXIgc2VsZl9ub2RlID0gc2VsZl9ib2R5LmdldF9tX25vZGVzKCkuYXQoZGVzY3JpcHRpb24ubjEpO1xuICB2YXIgb3RoZXJfbm9kZSA9IG90aGVyX2JvZHkuZ2V0X21fbm9kZXMoKS5hdChkZXNjcmlwdGlvbi5uMik7XG5cbiAgdmFyIHNlbGZfdmVjID0gc2VsZl9ub2RlLmdldF9tX3goKTtcbiAgdmFyIG90aGVyX3ZlYyA9IG90aGVyX25vZGUuZ2V0X21feCgpO1xuXG4gIHZhciBmb3JjZV94ID0gb3RoZXJfdmVjLngoKSAtIHNlbGZfdmVjLngoKTtcbiAgdmFyIGZvcmNlX3kgPSBvdGhlcl92ZWMueSgpIC0gc2VsZl92ZWMueSgpO1xuICB2YXIgZm9yY2VfeiA9IG90aGVyX3ZlYy56KCkgLSBzZWxmX3ZlYy56KCk7XG5cblxuICAvLyB2YXIgbW9kaWZpZXIgPSAzMDtcblxuICBsZXQgY2FjaGVkX2Rpc3RhbmNlLCBsaW5rZWQgPSBmYWxzZTtcblxuICBjb25zdCBfbG9vcCA9IHNldEludGVydmFsKCgpID0+IHtcbiAgICBmb3JjZV94ID0gb3RoZXJfdmVjLngoKSAtIHNlbGZfdmVjLngoKTtcbiAgICBmb3JjZV95ID0gb3RoZXJfdmVjLnkoKSAtIHNlbGZfdmVjLnkoKTtcbiAgICBmb3JjZV96ID0gb3RoZXJfdmVjLnooKSAtIHNlbGZfdmVjLnooKTtcblxuICAgIGxldCBkaXN0YW5jZSA9IE1hdGguc3FydChmb3JjZV94ICogZm9yY2VfeCArIGZvcmNlX3kgKiBmb3JjZV95ICsgZm9yY2VfeiAqIGZvcmNlX3opO1xuXG4gICAgaWYgKGNhY2hlZF9kaXN0YW5jZSAmJiAhbGlua2VkICYmIGNhY2hlZF9kaXN0YW5jZSA8IGRpc3RhbmNlKSB7IC8vIGNhY2hlZF9kaXN0YW5jZSAmJiAhbGlua2VkICYmIGNhY2hlZF9kaXN0YW5jZSA8IGRpc3RhbmNlXG5cbiAgICAgIGxpbmtlZCA9IHRydWU7XG5cbiAgICAgIC8vIGxldCBzZWxmX3ZlbCA9IHNlbGZfbm9kZS5nZXRfbV92KCk7XG4gICAgICAvL1xuICAgICAgLy8gX3ZlYzNfMS5zZXRYKC1zZWxmX3ZlbC54KCkpO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRZKC1zZWxmX3ZlbC55KCkpO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRaKC1zZWxmX3ZlbC56KCkpO1xuICAgICAgLy9cbiAgICAgIC8vIGxldCBvdGhlcl92ZWwgPSBvdGhlcl9ub2RlLmdldF9tX3YoKTtcbiAgICAgIC8vXG4gICAgICAvLyBfdmVjM18yLnNldFgoLW90aGVyX3ZlbC54KCkpO1xuICAgICAgLy8gX3ZlYzNfMi5zZXRZKC1vdGhlcl92ZWwueSgpKTtcbiAgICAgIC8vIF92ZWMzXzIuc2V0Wigtb3RoZXJfdmVsLnooKSk7XG5cbiAgICAgIGNvbnNvbGUubG9nKCdsaW5rIScpO1xuXG4gICAgICBfdmVjM18xLnNldFgoMCk7XG4gICAgICBfdmVjM18xLnNldFkoMCk7XG4gICAgICBfdmVjM18xLnNldFooMCk7XG5cbiAgICAgIHNlbGZfYm9keS5zZXRWZWxvY2l0eShcbiAgICAgICAgX3ZlYzNfMVxuICAgICAgKTtcblxuICAgICAgb3RoZXJfYm9keS5zZXRWZWxvY2l0eShcbiAgICAgICAgX3ZlYzNfMVxuICAgICAgKTtcblxuXG5cbiAgICAgIC8vIHNlbGZfYm9keS5hZGRWZWxvY2l0eShfdmVjM18xKTtcbiAgICAgIC8vIG90aGVyX2JvZHkuYWRkVmVsb2NpdHkoX3ZlYzNfMik7XG5cbiAgICAgIC8vIHNlbGZfcmVsYXRpdmVfeCA9IHNlbGZfbm9kZS54KCk7XG4gICAgICAvLyBzZWxmX3JlbGF0aXZlX3kgPSBzZWxmX25vZGUueSgpO1xuICAgICAgLy8gc2VsZl9yZWxhdGl2ZV96ID0gc2VsZl9ub2RlLnooKTtcbiAgICAgIC8vXG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV94ID0gb3RoZXJfbm9kZS54KCk7XG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV95ID0gb3RoZXJfbm9kZS55KCk7XG4gICAgICAvLyBvdGhlcl9yZWxhdGl2ZV96ID0gb3RoZXJfbm9kZS56KCk7XG5cbiAgICAgIC8vIHNlbGZfcmVsYXRpdmUgPSBuZXcgQW1tby5idFZlY3RvcjMoKTtcbiAgICAgIC8vIHNlbGZfcmVsYXRpdmUuc2V0WCgpO1xuXG4gICAgICAvLyBjb25zb2xlLmxvZygnbGluayEnKTtcbiAgICAgIC8vIHNlbGZfYm9keS5hcHBlbmRBbmNob3IoZGVzY3JpcHRpb24ubjEsIGNvbm5lY3RvciwgdHJ1ZSwgMC41KTtcbiAgICAgIC8vIG90aGVyX2JvZHkuYXBwZW5kQW5jaG9yKGRlc2NyaXB0aW9uLm4yLCBjb25uZWN0b3IsIHRydWUsIDAuNSk7XG4gICAgICAvLyBjbGVhckludGVydmFsKF9sb29wKTtcblxuICAgICAgLy8gX3ZlYzNfMS5zZXRYKDApO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRZKDApO1xuICAgICAgLy8gX3ZlYzNfMS5zZXRaKDApO1xuXG4gICAgICAvLyBzZWxmX2JvZHkuc2V0VmVsb2NpdHkoX3ZlYzNfMSk7XG4gICAgICAvLyBvdGhlcl9ib2R5LnNldFZlbG9jaXR5KF92ZWMzXzEpO1xuXG4gICAgICAvLyBvdGhlcl9ib2R5LmFkZEZvcmNlKFxuICAgICAgLy8gICBfdmVjM18yLFxuICAgICAgLy8gICBkZXNjcmlwdGlvbi5uMlxuICAgICAgLy8gKTtcblxuICAgICAgLy8gZGVzY3JpcHRpb24ubW9kaWZpZXIgKj0gMS42O1xuICAgIH1cblxuICAgIGNvbnN0IG1vZGlmZXIyID0gbGlua2VkID8gNDAgOiAxO1xuXG4gICAgZm9yY2VfeCAqPSBNYXRoLm1heChkaXN0YW5jZSwgMSkgKiBkZXNjcmlwdGlvbi5tb2RpZmllciAqIG1vZGlmZXIyO1xuICAgIGZvcmNlX3kgKj0gTWF0aC5tYXgoZGlzdGFuY2UsIDEpICogZGVzY3JpcHRpb24ubW9kaWZpZXIgKiBtb2RpZmVyMjtcbiAgICBmb3JjZV96ICo9IE1hdGgubWF4KGRpc3RhbmNlLCAxKSAqIGRlc2NyaXB0aW9uLm1vZGlmaWVyICogbW9kaWZlcjI7XG5cbiAgICBfdmVjM18xLnNldFgoZm9yY2VfeCk7XG4gICAgX3ZlYzNfMS5zZXRZKGZvcmNlX3kpO1xuICAgIF92ZWMzXzEuc2V0Wihmb3JjZV96KTtcblxuICAgIF92ZWMzXzIuc2V0WCgtZm9yY2VfeCk7XG4gICAgX3ZlYzNfMi5zZXRZKC1mb3JjZV95KTtcbiAgICBfdmVjM18yLnNldFooLWZvcmNlX3opO1xuXG4gICAgc2VsZl9ib2R5LmFkZFZlbG9jaXR5KFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIGRlc2NyaXB0aW9uLm4xXG4gICAgKTtcblxuICAgIG90aGVyX2JvZHkuYWRkVmVsb2NpdHkoXG4gICAgICBfdmVjM18yLFxuICAgICAgZGVzY3JpcHRpb24ubjJcbiAgICApO1xuXG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIC8vIHNlbGZfcmVsYXRpdmVfeCA9IG51bGw7XG4gICAgLy8gfVxuXG5cblxuICAgIC8vIGlmIChzZWxmX3JlbGF0aXZlX3gpIHtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WChzZWxmX3JlbGF0aXZlX3ggLSBzZWxmX25vZGUueCgpKTtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WShzZWxmX3JlbGF0aXZlX3kgLSBzZWxmX25vZGUueSgpKTtcbiAgICAvLyAgIF92ZWMzXzEuc2V0WihzZWxmX3JlbGF0aXZlX3ogLSBzZWxmX25vZGUueigpKTtcbiAgICAvL1xuICAgIC8vICAgX3ZlYzNfMi5zZXRYKG90aGVyX3JlbGF0aXZlX3ggLSBvdGhlcl9ub2RlLngoKSk7XG4gICAgLy8gICBfdmVjM18yLnNldFkob3RoZXJfcmVsYXRpdmVfeSAtIG90aGVyX25vZGUueSgpKTtcbiAgICAvLyAgIF92ZWMzXzIuc2V0WihvdGhlcl9yZWxhdGl2ZV96IC0gb3RoZXJfbm9kZS56KCkpO1xuICAgIC8vIH0gZWxzZSB7XG5cbiAgICAvLyB9XG5cblxuXG5cbiAgICBjYWNoZWRfZGlzdGFuY2UgPSBkaXN0YW5jZTtcbiAgfSwgMTApO1xufVxuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGVuZExpbmsgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgLy8gY29uc29sZS5sb2coQW1tbyk7XG4gIC8vIGNvbnNvbGUubG9nKG5ldyBBbW1vLk1hdGVyaWFsKCkpO1xuXG4gIC8vIHZhciBfbWF0ID0gbmV3IEFtbW8uTWF0ZXJpYWwoKTtcbiAgLy9cbiAgLy8gX21hdC5zZXRfbV9rQVNUKDApO1xuICAvLyBfbWF0LnNldF9tX2tMU1QoMCk7XG4gIC8vIF9tYXQuc2V0X21fa1ZTVCgwKTtcbiAgLy9cbiAgLy8gX29iamVjdHNbZGVzY3JpcHRpb24uc2VsZl0uYXBwZW5kTGluayhcbiAgLy8gICBkZXNjcmlwdGlvbi5uMSxcbiAgLy8gICBkZXNjcmlwdGlvbi5uMixcbiAgLy8gICBfbWF0LFxuICAvLyAgIGZhbHNlXG4gIC8vICk7XG5cbiAgX3ZlYzNfMS5zZXRYKDEwMDApO1xuICBfdmVjM18xLnNldFkoMCk7XG4gIF92ZWMzXzEuc2V0WigwKTtcblxuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5zZWxmXS5hZGRGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIGRlc2NyaXB0aW9uLm4xXG4gICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYXBwZW5kTGluZWFySm9pbnQgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgLy8gY29uc29sZS5sb2coJ0FtbW8nLCBBbW1vKTtcbiAgdmFyIHNwZWNzID0gbmV3IEFtbW8uU3BlY3MoKTtcbiAgdmFyIF9wb3MgPSBkZXNjcmlwdGlvbi5zcGVjcy5wb3NpdGlvbjtcblxuICBzcGVjcy5zZXRfcG9zaXRpb24obmV3IEFtbW8uYnRWZWN0b3IzKF9wb3NbMF0sIF9wb3NbMV0sIF9wb3NbMl0pKTtcbiAgaWYgKGRlc2NyaXB0aW9uLnNwZWNzLmVycCkgc3BlY3Muc2V0X2VycChkZXNjcmlwdGlvbi5zcGVjcy5lcnApO1xuICBpZiAoZGVzY3JpcHRpb24uc3BlY3MuY2ZtKSBzcGVjcy5zZXRfY2ZtKGRlc2NyaXB0aW9uLnNwZWNzLmNmbSk7XG4gIGlmIChkZXNjcmlwdGlvbi5zcGVjcy5zcGxpdCkgc3BlY3Muc2V0X3NwbGl0KGRlc2NyaXB0aW9uLnNwZWNzLnNwbGl0KTtcblxuICAvLyBjb25zb2xlLmxvZyhzcGVjcyk7XG4gIC8vXG4gIC8vIC8vIGxqb2ludC5zZXRfbV9ycG9zKFxuICAvLyAvLyAgIG5ldyBBbW1vLmJ0VmVjdG9yMyhfcG9zMVswXSwgX3BvczFbMV0sIF9wb3MxWzJdKSxcbiAgLy8gLy8gICBuZXcgQW1tby5idFZlY3RvcjMoX3BvczJbMF0sIF9wb3MyWzFdLCBfcG9zMlsyXSlcbiAgLy8gLy8gKTtcbiAgLy9cbiAgLy8gLy8gY29uc29sZS5sb2coJ2xqb2ludCcsIGxqb2ludCk7XG4gIC8vXG5cbiAgLy8gY29uc29sZS5sb2coJ2JvZHknLCBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XSk7XG4gIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnNlbGZdXG4gICAgLmFwcGVuZExpbmVhckpvaW50KFxuICAgICAgc3BlY3MsXG4gICAgICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5ib2R5XVxuICAgICk7XG59XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkT2JqZWN0ID0gKGRlc2NyaXB0aW9uKSA9PiB7XG4gIGxldCBib2R5LCBtb3Rpb25TdGF0ZTtcblxuICBpZiAoZGVzY3JpcHRpb24udHlwZS5pbmRleE9mKCdzb2Z0JykgIT09IC0xKSB7XG4gICAgYm9keSA9IGNyZWF0ZVNvZnRCb2R5KGRlc2NyaXB0aW9uKTtcblxuICAgIGNvbnN0IHNiQ29uZmlnID0gYm9keS5nZXRfbV9jZmcoKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi52aXRlcmF0aW9ucykgc2JDb25maWcuc2V0X3ZpdGVyYXRpb25zKGRlc2NyaXB0aW9uLnZpdGVyYXRpb25zKTtcbiAgICBpZiAoZGVzY3JpcHRpb24ucGl0ZXJhdGlvbnMpIHNiQ29uZmlnLnNldF9waXRlcmF0aW9ucyhkZXNjcmlwdGlvbi5waXRlcmF0aW9ucyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRpdGVyYXRpb25zKSBzYkNvbmZpZy5zZXRfZGl0ZXJhdGlvbnMoZGVzY3JpcHRpb24uZGl0ZXJhdGlvbnMpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5jaXRlcmF0aW9ucykgc2JDb25maWcuc2V0X2NpdGVyYXRpb25zKGRlc2NyaXB0aW9uLmNpdGVyYXRpb25zKTtcbiAgICBzYkNvbmZpZy5zZXRfY29sbGlzaW9ucygweDExKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RGKGRlc2NyaXB0aW9uLmZyaWN0aW9uKTtcbiAgICBzYkNvbmZpZy5zZXRfa0RQKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5wcmVzc3VyZSkgc2JDb25maWcuc2V0X2tQUihkZXNjcmlwdGlvbi5wcmVzc3VyZSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmRyYWcpIHNiQ29uZmlnLnNldF9rREcoZGVzY3JpcHRpb24uZHJhZyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmxpZnQpIHNiQ29uZmlnLnNldF9rTEYoZGVzY3JpcHRpb24ubGlmdCk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLmFuY2hvckhhcmRuZXNzKSBzYkNvbmZpZy5zZXRfa0FIUihkZXNjcmlwdGlvbi5hbmNob3JIYXJkbmVzcyk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpIHNiQ29uZmlnLnNldF9rQ0hSKGRlc2NyaXB0aW9uLnJpZ2lkSGFyZG5lc3MpO1xuXG4gICAgaWYgKGRlc2NyaXB0aW9uLmtsc3QpIGJvZHkuZ2V0X21fbWF0ZXJpYWxzKCkuYXQoMCkuc2V0X21fa0xTVChkZXNjcmlwdGlvbi5rbHN0KTtcbiAgICBpZiAoZGVzY3JpcHRpb24ua2FzdCkgYm9keS5nZXRfbV9tYXRlcmlhbHMoKS5hdCgwKS5zZXRfbV9rQVNUKGRlc2NyaXB0aW9uLmthc3QpO1xuICAgIGlmIChkZXNjcmlwdGlvbi5rdnN0KSBib2R5LmdldF9tX21hdGVyaWFscygpLmF0KDApLnNldF9tX2tWU1QoZGVzY3JpcHRpb24ua3ZzdCk7XG5cbiAgICBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oXG4gICAgICB0eXBlb2YgZGVzY3JpcHRpb24ubWFyZ2luICE9PSAndW5kZWZpbmVkJyA/IGRlc2NyaXB0aW9uLm1hcmdpbiA6IDAuMVxuICAgICk7XG5cbiAgICAvLyBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRNYXJnaW4oMCk7XG5cbiAgICAvLyBBbW1vLmNhc3RPYmplY3QoYm9keSwgQW1tby5idENvbGxpc2lvbk9iamVjdCkuZ2V0Q29sbGlzaW9uU2hhcGUoKS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgYm9keS50eXBlID0gMDsgLy8gU29mdEJvZHkuXG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0Um9wZU1lc2gnKSBib2R5LnJvcGUgPSB0cnVlO1xuICAgIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdENsb3RoTWVzaCcpIGJvZHkuY2xvdGggPSB0cnVlO1xuXG4gICAgX3RyYW5zZm9ybS5zZXRJZGVudGl0eSgpO1xuXG4gICAgLy8gQHRlc3RcbiAgICBfcXVhdC5zZXRYKGRlc2NyaXB0aW9uLnJvdGF0aW9uLngpO1xuICAgIF9xdWF0LnNldFkoZGVzY3JpcHRpb24ucm90YXRpb24ueSk7XG4gICAgX3F1YXQuc2V0WihkZXNjcmlwdGlvbi5yb3RhdGlvbi56KTtcbiAgICBfcXVhdC5zZXRXKGRlc2NyaXB0aW9uLnJvdGF0aW9uLncpO1xuICAgIGJvZHkucm90YXRlKF9xdWF0KTtcblxuICAgIF92ZWMzXzEuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMS5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIGJvZHkudHJhbnNsYXRlKF92ZWMzXzEpO1xuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG4gICAgYm9keS5zY2FsZShfdmVjM18xKTtcblxuICAgIGJvZHkuc2V0VG90YWxNYXNzKGRlc2NyaXB0aW9uLm1hc3MsIGZhbHNlKTtcbiAgICB3b3JsZC5hZGRTb2Z0Qm9keShib2R5LCAxLCAtMSk7XG4gICAgaWYgKGRlc2NyaXB0aW9uLnR5cGUgPT09ICdzb2Z0VHJpbWVzaCcpIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSArPSBib2R5LmdldF9tX2ZhY2VzKCkuc2l6ZSgpICogMztcbiAgICBlbHNlIGlmIChkZXNjcmlwdGlvbi50eXBlID09PSAnc29mdFJvcGVNZXNoJykgX3NvZnRib2R5X3JlcG9ydF9zaXplICs9IGJvZHkuZ2V0X21fbm9kZXMoKS5zaXplKCk7XG4gICAgZWxzZSBfc29mdGJvZHlfcmVwb3J0X3NpemUgKz0gYm9keS5nZXRfbV9ub2RlcygpLnNpemUoKSAqIDM7XG5cbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMrKztcbiAgfVxuICBlbHNlIHtcbiAgICBsZXQgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbik7XG5cbiAgICBpZiAoIXNoYXBlKSByZXR1cm47XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgY2hpbGRyZW4gdGhlbiB0aGlzIGlzIGEgY29tcG91bmQgc2hhcGVcbiAgICBpZiAoZGVzY3JpcHRpb24uY2hpbGRyZW4pIHtcbiAgICAgIGNvbnN0IGNvbXBvdW5kX3NoYXBlID0gbmV3IEFtbW8uYnRDb21wb3VuZFNoYXBlKCk7XG4gICAgICBjb21wb3VuZF9zaGFwZS5hZGRDaGlsZFNoYXBlKF90cmFuc2Zvcm0sIHNoYXBlKTtcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkZXNjcmlwdGlvbi5jaGlsZHJlbi5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBfY2hpbGQgPSBkZXNjcmlwdGlvbi5jaGlsZHJlbltpXTtcblxuICAgICAgICBjb25zdCB0cmFucyA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICAgIHRyYW5zLnNldElkZW50aXR5KCk7XG5cbiAgICAgICAgX3ZlYzNfMS5zZXRYKF9jaGlsZC5wb3NpdGlvbl9vZmZzZXQueCk7XG4gICAgICAgIF92ZWMzXzEuc2V0WShfY2hpbGQucG9zaXRpb25fb2Zmc2V0LnkpO1xuICAgICAgICBfdmVjM18xLnNldFooX2NoaWxkLnBvc2l0aW9uX29mZnNldC56KTtcbiAgICAgICAgdHJhbnMuc2V0T3JpZ2luKF92ZWMzXzEpO1xuXG4gICAgICAgIF9xdWF0LnNldFgoX2NoaWxkLnJvdGF0aW9uLngpO1xuICAgICAgICBfcXVhdC5zZXRZKF9jaGlsZC5yb3RhdGlvbi55KTtcbiAgICAgICAgX3F1YXQuc2V0WihfY2hpbGQucm90YXRpb24ueik7XG4gICAgICAgIF9xdWF0LnNldFcoX2NoaWxkLnJvdGF0aW9uLncpO1xuICAgICAgICB0cmFucy5zZXRSb3RhdGlvbihfcXVhdCk7XG5cbiAgICAgICAgc2hhcGUgPSBjcmVhdGVTaGFwZShkZXNjcmlwdGlvbi5jaGlsZHJlbltpXSk7XG4gICAgICAgIGNvbXBvdW5kX3NoYXBlLmFkZENoaWxkU2hhcGUodHJhbnMsIHNoYXBlKTtcbiAgICAgICAgQW1tby5kZXN0cm95KHRyYW5zKTtcbiAgICAgIH1cblxuICAgICAgc2hhcGUgPSBjb21wb3VuZF9zaGFwZTtcbiAgICAgIF9jb21wb3VuZF9zaGFwZXNbZGVzY3JpcHRpb24uaWRdID0gc2hhcGU7XG4gICAgfVxuXG4gICAgX3ZlYzNfMS5zZXRYKGRlc2NyaXB0aW9uLnNjYWxlLngpO1xuICAgIF92ZWMzXzEuc2V0WShkZXNjcmlwdGlvbi5zY2FsZS55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uc2NhbGUueik7XG5cbiAgICBzaGFwZS5zZXRMb2NhbFNjYWxpbmcoX3ZlYzNfMSk7XG4gICAgc2hhcGUuc2V0TWFyZ2luKFxuICAgICAgdHlwZW9mIGRlc2NyaXB0aW9uLm1hcmdpbiAhPT0gJ3VuZGVmaW5lZCcgPyBkZXNjcmlwdGlvbi5tYXJnaW4gOiAwXG4gICAgKTtcblxuICAgIF92ZWMzXzEuc2V0WCgwKTtcbiAgICBfdmVjM18xLnNldFkoMCk7XG4gICAgX3ZlYzNfMS5zZXRaKDApO1xuICAgIHNoYXBlLmNhbGN1bGF0ZUxvY2FsSW5lcnRpYShkZXNjcmlwdGlvbi5tYXNzLCBfdmVjM18xKTtcblxuICAgIF90cmFuc2Zvcm0uc2V0SWRlbnRpdHkoKTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi5wb3NpdGlvbi54KTtcbiAgICBfdmVjM18yLnNldFkoZGVzY3JpcHRpb24ucG9zaXRpb24ueSk7XG4gICAgX3ZlYzNfMi5zZXRaKGRlc2NyaXB0aW9uLnBvc2l0aW9uLnopO1xuICAgIF90cmFuc2Zvcm0uc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgX3F1YXQuc2V0WChkZXNjcmlwdGlvbi5yb3RhdGlvbi54KTtcbiAgICBfcXVhdC5zZXRZKGRlc2NyaXB0aW9uLnJvdGF0aW9uLnkpO1xuICAgIF9xdWF0LnNldFooZGVzY3JpcHRpb24ucm90YXRpb24ueik7XG4gICAgX3F1YXQuc2V0VyhkZXNjcmlwdGlvbi5yb3RhdGlvbi53KTtcbiAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcblxuICAgIG1vdGlvblN0YXRlID0gbmV3IEFtbW8uYnREZWZhdWx0TW90aW9uU3RhdGUoX3RyYW5zZm9ybSk7IC8vICNUT0RPOiBidERlZmF1bHRNb3Rpb25TdGF0ZSBzdXBwb3J0cyBjZW50ZXIgb2YgbWFzcyBvZmZzZXQgYXMgc2Vjb25kIGFyZ3VtZW50IC0gaW1wbGVtZW50XG4gICAgY29uc3QgcmJJbmZvID0gbmV3IEFtbW8uYnRSaWdpZEJvZHlDb25zdHJ1Y3Rpb25JbmZvKGRlc2NyaXB0aW9uLm1hc3MsIG1vdGlvblN0YXRlLCBzaGFwZSwgX3ZlYzNfMSk7XG5cbiAgICByYkluZm8uc2V0X21fZnJpY3Rpb24oZGVzY3JpcHRpb24uZnJpY3Rpb24pO1xuICAgIHJiSW5mby5zZXRfbV9yZXN0aXR1dGlvbihkZXNjcmlwdGlvbi5yZXN0aXR1dGlvbik7XG4gICAgcmJJbmZvLnNldF9tX2xpbmVhckRhbXBpbmcoZGVzY3JpcHRpb24uZGFtcGluZyk7XG4gICAgcmJJbmZvLnNldF9tX2FuZ3VsYXJEYW1waW5nKGRlc2NyaXB0aW9uLmRhbXBpbmcpO1xuXG4gICAgYm9keSA9IG5ldyBBbW1vLmJ0UmlnaWRCb2R5KHJiSW5mbyk7XG4gICAgYm9keS5zZXRBY3RpdmF0aW9uU3RhdGUoZGVzY3JpcHRpb24uc3RhdGUgfHwgNCk7XG4gICAgQW1tby5kZXN0cm95KHJiSW5mbyk7XG5cbiAgICBpZiAodHlwZW9mIGRlc2NyaXB0aW9uLmNvbGxpc2lvbl9mbGFncyAhPT0gJ3VuZGVmaW5lZCcpIGJvZHkuc2V0Q29sbGlzaW9uRmxhZ3MoZGVzY3JpcHRpb24uY29sbGlzaW9uX2ZsYWdzKTtcblxuICAgIGlmIChkZXNjcmlwdGlvbi5ncm91cCAmJiBkZXNjcmlwdGlvbi5tYXNrKSB3b3JsZC5hZGRSaWdpZEJvZHkoYm9keSwgZGVzY3JpcHRpb24uZ3JvdXAsIGRlc2NyaXB0aW9uLm1hc2spO1xuICAgIGVsc2Ugd29ybGQuYWRkUmlnaWRCb2R5KGJvZHkpO1xuICAgIGJvZHkudHlwZSA9IDE7IC8vIFJpZ2lkQm9keS5cbiAgICBfbnVtX3JpZ2lkYm9keV9vYmplY3RzKys7XG4gIH1cblxuICBib2R5LmFjdGl2YXRlKCk7XG5cbiAgYm9keS5pZCA9IGRlc2NyaXB0aW9uLmlkO1xuICBfb2JqZWN0c1tib2R5LmlkXSA9IGJvZHk7XG4gIF9tb3Rpb25fc3RhdGVzW2JvZHkuaWRdID0gbW90aW9uU3RhdGU7XG5cbiAgX29iamVjdHNfYW1tb1tib2R5LmEgPT09IHVuZGVmaW5lZCA/IGJvZHkucHRyIDogYm9keS5hXSA9IGJvZHkuaWQ7XG4gIF9udW1fb2JqZWN0cysrO1xuXG4gIHNlbmQoeyBjbWQ6ICdvYmplY3RSZWFkeScsIHBhcmFtczogYm9keS5pZCB9KTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBjb25zdCB2ZWhpY2xlX3R1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuXG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9zdGlmZm5lc3MpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9jb21wcmVzc2lvbik7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnN1c3BlbnNpb25fZGFtcGluZyk7XG4gIHZlaGljbGVfdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi5tYXhfc3VzcGVuc2lvbl90cmF2ZWwpO1xuICB2ZWhpY2xlX3R1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24ubWF4X3N1c3BlbnNpb25fZm9yY2UpO1xuXG4gIGNvbnN0IHZlaGljbGUgPSBuZXcgQW1tby5idFJheWNhc3RWZWhpY2xlKFxuICAgIHZlaGljbGVfdHVuaW5nLFxuICAgIF9vYmplY3RzW2Rlc2NyaXB0aW9uLnJpZ2lkQm9keV0sXG4gICAgbmV3IEFtbW8uYnREZWZhdWx0VmVoaWNsZVJheWNhc3Rlcih3b3JsZClcbiAgKTtcblxuICB2ZWhpY2xlLnR1bmluZyA9IHZlaGljbGVfdHVuaW5nO1xuICBfb2JqZWN0c1tkZXNjcmlwdGlvbi5yaWdpZEJvZHldLnNldEFjdGl2YXRpb25TdGF0ZSg0KTtcbiAgdmVoaWNsZS5zZXRDb29yZGluYXRlU3lzdGVtKDAsIDEsIDIpO1xuXG4gIHdvcmxkLmFkZFZlaGljbGUodmVoaWNsZSk7XG4gIF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gPSB2ZWhpY2xlO1xufTtcbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlVmVoaWNsZSA9IChkZXNjcmlwdGlvbikgPT4ge1xuICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdID0gbnVsbDtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuYWRkV2hlZWwgPSAoZGVzY3JpcHRpb24pID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXNjcmlwdGlvbi5pZF0gIT09IHVuZGVmaW5lZCkge1xuICAgIGxldCB0dW5pbmcgPSBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLnR1bmluZztcbiAgICBpZiAoZGVzY3JpcHRpb24udHVuaW5nICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHR1bmluZyA9IG5ldyBBbW1vLmJ0VmVoaWNsZVR1bmluZygpO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25TdGlmZm5lc3MoZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fc3RpZmZuZXNzKTtcbiAgICAgIHR1bmluZy5zZXRfbV9zdXNwZW5zaW9uQ29tcHJlc3Npb24oZGVzY3JpcHRpb24udHVuaW5nLnN1c3BlbnNpb25fY29tcHJlc3Npb24pO1xuICAgICAgdHVuaW5nLnNldF9tX3N1c3BlbnNpb25EYW1waW5nKGRlc2NyaXB0aW9uLnR1bmluZy5zdXNwZW5zaW9uX2RhbXBpbmcpO1xuICAgICAgdHVuaW5nLnNldF9tX21heFN1c3BlbnNpb25UcmF2ZWxDbShkZXNjcmlwdGlvbi50dW5pbmcubWF4X3N1c3BlbnNpb25fdHJhdmVsKTtcbiAgICAgIHR1bmluZy5zZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UoZGVzY3JpcHRpb24udHVuaW5nLm1heF9zdXNwZW5zaW9uX2ZvcmNlKTtcbiAgICB9XG5cbiAgICBfdmVjM18xLnNldFgoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC54KTtcbiAgICBfdmVjM18xLnNldFkoZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC55KTtcbiAgICBfdmVjM18xLnNldFooZGVzY3JpcHRpb24uY29ubmVjdGlvbl9wb2ludC56KTtcblxuICAgIF92ZWMzXzIuc2V0WChkZXNjcmlwdGlvbi53aGVlbF9kaXJlY3Rpb24ueCk7XG4gICAgX3ZlYzNfMi5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2RpcmVjdGlvbi55KTtcbiAgICBfdmVjM18yLnNldFooZGVzY3JpcHRpb24ud2hlZWxfZGlyZWN0aW9uLnopO1xuXG4gICAgX3ZlYzNfMy5zZXRYKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueCk7XG4gICAgX3ZlYzNfMy5zZXRZKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueSk7XG4gICAgX3ZlYzNfMy5zZXRaKGRlc2NyaXB0aW9uLndoZWVsX2F4bGUueik7XG5cbiAgICBfdmVoaWNsZXNbZGVzY3JpcHRpb24uaWRdLmFkZFdoZWVsKFxuICAgICAgX3ZlYzNfMSxcbiAgICAgIF92ZWMzXzIsXG4gICAgICBfdmVjM18zLFxuICAgICAgZGVzY3JpcHRpb24uc3VzcGVuc2lvbl9yZXN0X2xlbmd0aCxcbiAgICAgIGRlc2NyaXB0aW9uLndoZWVsX3JhZGl1cyxcbiAgICAgIHR1bmluZyxcbiAgICAgIGRlc2NyaXB0aW9uLmlzX2Zyb250X3doZWVsXG4gICAgKTtcbiAgfVxuXG4gIF9udW1fd2hlZWxzKys7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoMSArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSk7IC8vIG1lc3NhZ2UgaWQgJiAoICMgb2Ygb2JqZWN0cyB0byByZXBvcnQgKiAjIG9mIHZhbHVlcyBwZXIgb2JqZWN0IClcbiAgICB2ZWhpY2xlcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUO1xuICB9XG4gIGVsc2UgdmVoaWNsZXJlcG9ydCA9IFtNRVNTQUdFX1RZUEVTLlZFSElDTEVSRVBPUlRdO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zZXRTdGVlcmluZyA9IChkZXRhaWxzKSA9PiB7XG4gIGlmIChfdmVoaWNsZXNbZGV0YWlscy5pZF0gIT09IHVuZGVmaW5lZCkgX3ZlaGljbGVzW2RldGFpbHMuaWRdLnNldFN0ZWVyaW5nVmFsdWUoZGV0YWlscy5zdGVlcmluZywgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEJyYWtlID0gKGRldGFpbHMpID0+IHtcbiAgaWYgKF92ZWhpY2xlc1tkZXRhaWxzLmlkXSAhPT0gdW5kZWZpbmVkKSBfdmVoaWNsZXNbZGV0YWlscy5pZF0uc2V0QnJha2UoZGV0YWlscy5icmFrZSwgZGV0YWlscy53aGVlbCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5RW5naW5lRm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX3ZlaGljbGVzW2RldGFpbHMuaWRdICE9PSB1bmRlZmluZWQpIF92ZWhpY2xlc1tkZXRhaWxzLmlkXS5hcHBseUVuZ2luZUZvcmNlKGRldGFpbHMuZm9yY2UsIGRldGFpbHMud2hlZWwpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5yZW1vdmVPYmplY3QgPSAoZGV0YWlscykgPT4ge1xuICBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMCkge1xuICAgIF9udW1fc29mdGJvZHlfb2JqZWN0cy0tO1xuICAgIF9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSAtPSBfb2JqZWN0c1tkZXRhaWxzLmlkXS5nZXRfbV9ub2RlcygpLnNpemUoKTtcbiAgICB3b3JsZC5yZW1vdmVTb2Z0Qm9keShfb2JqZWN0c1tkZXRhaWxzLmlkXSk7XG4gIH1cbiAgZWxzZSBpZiAoX29iamVjdHNbZGV0YWlscy5pZF0udHlwZSA9PT0gMSkge1xuICAgIF9udW1fcmlnaWRib2R5X29iamVjdHMtLTtcbiAgICB3b3JsZC5yZW1vdmVSaWdpZEJvZHkoX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICAgIEFtbW8uZGVzdHJveShfbW90aW9uX3N0YXRlc1tkZXRhaWxzLmlkXSk7XG4gIH1cblxuICBBbW1vLmRlc3Ryb3koX29iamVjdHNbZGV0YWlscy5pZF0pO1xuICBpZiAoX2NvbXBvdW5kX3NoYXBlc1tkZXRhaWxzLmlkXSkgQW1tby5kZXN0cm95KF9jb21wb3VuZF9zaGFwZXNbZGV0YWlscy5pZF0pO1xuICBpZiAoX25vbmNhY2hlZF9zaGFwZXNbZGV0YWlscy5pZF0pIEFtbW8uZGVzdHJveShfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSk7XG5cbiAgX29iamVjdHNfYW1tb1tfb2JqZWN0c1tkZXRhaWxzLmlkXS5hID09PSB1bmRlZmluZWQgPyBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hIDogX29iamVjdHNbZGV0YWlscy5pZF0ucHRyXSA9IG51bGw7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgX21vdGlvbl9zdGF0ZXNbZGV0YWlscy5pZF0gPSBudWxsO1xuXG4gIGlmIChfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdKSBfY29tcG91bmRfc2hhcGVzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgaWYgKF9ub25jYWNoZWRfc2hhcGVzW2RldGFpbHMuaWRdKSBfbm9uY2FjaGVkX3NoYXBlc1tkZXRhaWxzLmlkXSA9IG51bGw7XG4gIF9udW1fb2JqZWN0cy0tO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy51cGRhdGVUcmFuc2Zvcm0gPSAoZGV0YWlscykgPT4ge1xuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKF9vYmplY3QudHlwZSA9PT0gMSkge1xuICAgIF9vYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybShfdHJhbnNmb3JtKTtcblxuICAgIGlmIChkZXRhaWxzLnBvcykge1xuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zLnopO1xuICAgICAgX3RyYW5zZm9ybS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG4gICAgfVxuXG4gICAgaWYgKGRldGFpbHMucXVhdCkge1xuICAgICAgX3F1YXQuc2V0WChkZXRhaWxzLnF1YXQueCk7XG4gICAgICBfcXVhdC5zZXRZKGRldGFpbHMucXVhdC55KTtcbiAgICAgIF9xdWF0LnNldFooZGV0YWlscy5xdWF0LnopO1xuICAgICAgX3F1YXQuc2V0VyhkZXRhaWxzLnF1YXQudyk7XG4gICAgICBfdHJhbnNmb3JtLnNldFJvdGF0aW9uKF9xdWF0KTtcbiAgICB9XG5cbiAgICBfb2JqZWN0LnNldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICAgIF9vYmplY3QuYWN0aXZhdGUoKTtcbiAgfVxuICBlbHNlIGlmIChfb2JqZWN0LnR5cGUgPT09IDApIHtcbiAgICAvLyBfb2JqZWN0LmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgaWYgKGRldGFpbHMucG9zKSB7XG4gICAgICBfdmVjM18xLnNldFgoZGV0YWlscy5wb3MueCk7XG4gICAgICBfdmVjM18xLnNldFkoZGV0YWlscy5wb3MueSk7XG4gICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3Mueik7XG4gICAgICBfdHJhbnNmb3JtLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICB9XG5cbiAgICBpZiAoZGV0YWlscy5xdWF0KSB7XG4gICAgICBfcXVhdC5zZXRYKGRldGFpbHMucXVhdC54KTtcbiAgICAgIF9xdWF0LnNldFkoZGV0YWlscy5xdWF0LnkpO1xuICAgICAgX3F1YXQuc2V0WihkZXRhaWxzLnF1YXQueik7XG4gICAgICBfcXVhdC5zZXRXKGRldGFpbHMucXVhdC53KTtcbiAgICAgIF90cmFuc2Zvcm0uc2V0Um90YXRpb24oX3F1YXQpO1xuICAgIH1cblxuICAgIF9vYmplY3QudHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuICB9XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnVwZGF0ZU1hc3MgPSAoZGV0YWlscykgPT4ge1xuICAvLyAjVE9ETzogY2hhbmdpbmcgYSBzdGF0aWMgb2JqZWN0IGludG8gZHluYW1pYyBpcyBidWdneVxuICBfb2JqZWN0ID0gX29iamVjdHNbZGV0YWlscy5pZF07XG5cbiAgLy8gUGVyIGh0dHA6Ly93d3cuYnVsbGV0cGh5c2ljcy5vcmcvQnVsbGV0L3BocEJCMy92aWV3dG9waWMucGhwP3A9JmY9OSZ0PTM2NjMjcDEzODE2XG4gIHdvcmxkLnJlbW92ZVJpZ2lkQm9keShfb2JqZWN0KTtcblxuICBfdmVjM18xLnNldFgoMCk7XG4gIF92ZWMzXzEuc2V0WSgwKTtcbiAgX3ZlYzNfMS5zZXRaKDApO1xuXG4gIF9vYmplY3Quc2V0TWFzc1Byb3BzKGRldGFpbHMubWFzcywgX3ZlYzNfMSk7XG4gIHdvcmxkLmFkZFJpZ2lkQm9keShfb2JqZWN0KTtcbiAgX29iamVjdC5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxJbXB1bHNlID0gKGRldGFpbHMpID0+IHtcbiAgX3ZlYzNfMS5zZXRYKGRldGFpbHMueCk7XG4gIF92ZWMzXzEuc2V0WShkZXRhaWxzLnkpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy56KTtcblxuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hcHBseUNlbnRyYWxJbXB1bHNlKF92ZWMzXzEpO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUltcHVsc2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5pbXB1bHNlX3gpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy5pbXB1bHNlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy5pbXB1bHNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlJbXB1bHNlKFxuICAgIF92ZWMzXzEsXG4gICAgX3ZlYzNfMlxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseVRvcnF1ZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLnRvcnF1ZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMudG9ycXVlX3kpO1xuICBfdmVjM18xLnNldFooZGV0YWlscy50b3JxdWVfeik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlUb3JxdWUoXG4gICAgX3ZlYzNfMVxuICApO1xuICBfb2JqZWN0c1tkZXRhaWxzLmlkXS5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hcHBseUNlbnRyYWxGb3JjZSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlDZW50cmFsRm9yY2UoX3ZlYzNfMSk7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmFwcGx5Rm9yY2UgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy5mb3JjZV94KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMuZm9yY2VfeSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLmZvcmNlX3opO1xuXG4gIF92ZWMzXzIuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18yLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMi5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYXBwbHlGb3JjZShcbiAgICBfdmVjM18xLFxuICAgIF92ZWMzXzJcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMub25TaW11bGF0aW9uUmVzdW1lID0gKCkgPT4ge1xuICBsYXN0X3NpbXVsYXRpb25fdGltZSA9IERhdGUubm93KCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldEFuZ3VsYXJWZWxvY2l0eSA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0TGluZWFyVmVsb2NpdHkgPSAoZGV0YWlscykgPT4ge1xuICBfdmVjM18xLnNldFgoZGV0YWlscy54KTtcbiAgX3ZlYzNfMS5zZXRZKGRldGFpbHMueSk7XG4gIF92ZWMzXzEuc2V0WihkZXRhaWxzLnopO1xuXG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldExpbmVhclZlbG9jaXR5KFxuICAgIF92ZWMzXzFcbiAgKTtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0QW5ndWxhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0QW5ndWxhckZhY3RvcihcbiAgICBfdmVjM18xXG4gICk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldExpbmVhckZhY3RvciA9IChkZXRhaWxzKSA9PiB7XG4gIF92ZWMzXzEuc2V0WChkZXRhaWxzLngpO1xuICBfdmVjM18xLnNldFkoZGV0YWlscy55KTtcbiAgX3ZlYzNfMS5zZXRaKGRldGFpbHMueik7XG5cbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0TGluZWFyRmFjdG9yKFxuICAgIF92ZWMzXzFcbiAgKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2V0RGFtcGluZyA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldERhbXBpbmcoZGV0YWlscy5saW5lYXIsIGRldGFpbHMuYW5ndWxhcik7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZE1vdGlvblRocmVzaG9sZCA9IChkZXRhaWxzKSA9PiB7XG4gIF9vYmplY3RzW2RldGFpbHMuaWRdLnNldENjZE1vdGlvblRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNldENjZFN3ZXB0U3BoZXJlUmFkaXVzID0gKGRldGFpbHMpID0+IHtcbiAgX29iamVjdHNbZGV0YWlscy5pZF0uc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMoZGV0YWlscy5yYWRpdXMpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5hZGRDb25zdHJhaW50ID0gKGRldGFpbHMpID0+IHtcbiAgbGV0IGNvbnN0cmFpbnQ7XG5cbiAgc3dpdGNoIChkZXRhaWxzLnR5cGUpIHtcblxuICBjYXNlICdwb2ludCc6XG4gICAge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0UG9pbnQyUG9pbnRDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgX3ZlYzNfMVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRQb2ludDJQb2ludENvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIF92ZWMzXzEsXG4gICAgICAgICAgX3ZlYzNfMlxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdoaW5nZSc6XG4gICAge1xuICAgICAgaWYgKGRldGFpbHMub2JqZWN0YiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMuYXhpcy54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMuYXhpcy55KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMuYXhpcy56KTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRIaW5nZUNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfdmVjM18xLFxuICAgICAgICAgIF92ZWMzXzJcbiAgICAgICAgKTtcblxuICAgICAgfVxuICAgICAgZWxzZSB7XG4gICAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgICBfdmVjM18xLnNldFooZGV0YWlscy5wb3NpdGlvbmEueik7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICBfdmVjM18zLnNldFgoZGV0YWlscy5heGlzLngpO1xuICAgICAgICBfdmVjM18zLnNldFkoZGV0YWlscy5heGlzLnkpO1xuICAgICAgICBfdmVjM18zLnNldFooZGV0YWlscy5heGlzLnopO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idEhpbmdlQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgICAgX3ZlYzNfMSxcbiAgICAgICAgICBfdmVjM18yLFxuICAgICAgICAgIF92ZWMzXzMsXG4gICAgICAgICAgX3ZlYzNfM1xuICAgICAgICApO1xuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdzbGlkZXInOlxuICAgIHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuICAgICAgY29uc3QgdHJhbnNmb3JtYSA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgdHJhbnNmb3JtYS5zZXRPcmlnaW4oX3ZlYzNfMSk7XG5cbiAgICAgIGxldCByb3RhdGlvbiA9IHRyYW5zZm9ybWEuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyKGRldGFpbHMuYXhpcy54LCBkZXRhaWxzLmF4aXMueSwgZGV0YWlscy5heGlzLnopO1xuICAgICAgdHJhbnNmb3JtYS5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGlmIChkZXRhaWxzLm9iamVjdGIpIHtcbiAgICAgICAgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG5cbiAgICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgICBfdmVjM18yLnNldFkoZGV0YWlscy5wb3NpdGlvbmIueSk7XG4gICAgICAgIF92ZWMzXzIuc2V0WihkZXRhaWxzLnBvc2l0aW9uYi56KTtcblxuICAgICAgICB0cmFuc2Zvcm1iLnNldE9yaWdpbihfdmVjM18yKTtcblxuICAgICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgICAgcm90YXRpb24uc2V0RXVsZXIoZGV0YWlscy5heGlzLngsIGRldGFpbHMuYXhpcy55LCBkZXRhaWxzLmF4aXMueik7XG4gICAgICAgIHRyYW5zZm9ybWIuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idFNsaWRlckNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0U2xpZGVyQ29uc3RyYWludChcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGFdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJ1ZVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBjb25zdHJhaW50LnRhID0gdHJhbnNmb3JtYTtcbiAgICAgIGNvbnN0cmFpbnQudGIgPSB0cmFuc2Zvcm1iO1xuXG4gICAgICBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYSk7XG4gICAgICBpZiAodHJhbnNmb3JtYiAhPT0gdW5kZWZpbmVkKSBBbW1vLmRlc3Ryb3kodHJhbnNmb3JtYik7XG5cbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgY2FzZSAnY29uZXR3aXN0JzpcbiAgICB7XG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgY29uc3QgdHJhbnNmb3JtYiA9IG5ldyBBbW1vLmJ0VHJhbnNmb3JtKCk7XG4gICAgICB0cmFuc2Zvcm1iLnNldElkZW50aXR5KCk7XG5cbiAgICAgIF92ZWMzXzEuc2V0WChkZXRhaWxzLnBvc2l0aW9uYS54KTtcbiAgICAgIF92ZWMzXzEuc2V0WShkZXRhaWxzLnBvc2l0aW9uYS55KTtcbiAgICAgIF92ZWMzXzEuc2V0WihkZXRhaWxzLnBvc2l0aW9uYS56KTtcblxuICAgICAgX3ZlYzNfMi5zZXRYKGRldGFpbHMucG9zaXRpb25iLngpO1xuICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgX3ZlYzNfMi5zZXRaKGRldGFpbHMucG9zaXRpb25iLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcbiAgICAgIHRyYW5zZm9ybWIuc2V0T3JpZ2luKF92ZWMzXzIpO1xuXG4gICAgICBsZXQgcm90YXRpb24gPSB0cmFuc2Zvcm1hLmdldFJvdGF0aW9uKCk7XG4gICAgICByb3RhdGlvbi5zZXRFdWxlclpZWCgtZGV0YWlscy5heGlzYS56LCAtZGV0YWlscy5heGlzYS55LCAtZGV0YWlscy5heGlzYS54KTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0Um90YXRpb24ocm90YXRpb24pO1xuXG4gICAgICByb3RhdGlvbiA9IHRyYW5zZm9ybWIuZ2V0Um90YXRpb24oKTtcbiAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgdHJhbnNmb3JtYi5zZXRSb3RhdGlvbihyb3RhdGlvbik7XG5cbiAgICAgIGNvbnN0cmFpbnQgPSBuZXcgQW1tby5idENvbmVUd2lzdENvbnN0cmFpbnQoXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0Yl0sXG4gICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgIHRyYW5zZm9ybWJcbiAgICAgICk7XG5cbiAgICAgIGNvbnN0cmFpbnQuc2V0TGltaXQoTWF0aC5QSSwgMCwgTWF0aC5QSSk7XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBjYXNlICdkb2YnOlxuICAgIHtcbiAgICAgIGxldCB0cmFuc2Zvcm1iO1xuXG4gICAgICBjb25zdCB0cmFuc2Zvcm1hID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgIHRyYW5zZm9ybWEuc2V0SWRlbnRpdHkoKTtcblxuICAgICAgX3ZlYzNfMS5zZXRYKGRldGFpbHMucG9zaXRpb25hLngpO1xuICAgICAgX3ZlYzNfMS5zZXRZKGRldGFpbHMucG9zaXRpb25hLnkpO1xuICAgICAgX3ZlYzNfMS5zZXRaKGRldGFpbHMucG9zaXRpb25hLnopO1xuXG4gICAgICB0cmFuc2Zvcm1hLnNldE9yaWdpbihfdmVjM18xKTtcblxuICAgICAgbGV0IHJvdGF0aW9uID0gdHJhbnNmb3JtYS5nZXRSb3RhdGlvbigpO1xuICAgICAgcm90YXRpb24uc2V0RXVsZXJaWVgoLWRldGFpbHMuYXhpc2EueiwgLWRldGFpbHMuYXhpc2EueSwgLWRldGFpbHMuYXhpc2EueCk7XG4gICAgICB0cmFuc2Zvcm1hLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgaWYgKGRldGFpbHMub2JqZWN0Yikge1xuICAgICAgICB0cmFuc2Zvcm1iID0gbmV3IEFtbW8uYnRUcmFuc2Zvcm0oKTtcbiAgICAgICAgdHJhbnNmb3JtYi5zZXRJZGVudGl0eSgpO1xuXG4gICAgICAgIF92ZWMzXzIuc2V0WChkZXRhaWxzLnBvc2l0aW9uYi54KTtcbiAgICAgICAgX3ZlYzNfMi5zZXRZKGRldGFpbHMucG9zaXRpb25iLnkpO1xuICAgICAgICBfdmVjM18yLnNldFooZGV0YWlscy5wb3NpdGlvbmIueik7XG5cbiAgICAgICAgdHJhbnNmb3JtYi5zZXRPcmlnaW4oX3ZlYzNfMik7XG5cbiAgICAgICAgcm90YXRpb24gPSB0cmFuc2Zvcm1iLmdldFJvdGF0aW9uKCk7XG4gICAgICAgIHJvdGF0aW9uLnNldEV1bGVyWllYKC1kZXRhaWxzLmF4aXNiLnosIC1kZXRhaWxzLmF4aXNiLnksIC1kZXRhaWxzLmF4aXNiLngpO1xuICAgICAgICB0cmFuc2Zvcm1iLnNldFJvdGF0aW9uKHJvdGF0aW9uKTtcblxuICAgICAgICBjb25zdHJhaW50ID0gbmV3IEFtbW8uYnRHZW5lcmljNkRvZkNvbnN0cmFpbnQoXG4gICAgICAgICAgX29iamVjdHNbZGV0YWlscy5vYmplY3RhXSxcbiAgICAgICAgICBfb2JqZWN0c1tkZXRhaWxzLm9iamVjdGJdLFxuICAgICAgICAgIHRyYW5zZm9ybWEsXG4gICAgICAgICAgdHJhbnNmb3JtYixcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBlbHNlIHtcbiAgICAgICAgY29uc3RyYWludCA9IG5ldyBBbW1vLmJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50KFxuICAgICAgICAgIF9vYmplY3RzW2RldGFpbHMub2JqZWN0YV0sXG4gICAgICAgICAgdHJhbnNmb3JtYSxcbiAgICAgICAgICB0cnVlXG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0cmFpbnQudGEgPSB0cmFuc2Zvcm1hO1xuICAgICAgY29uc3RyYWludC50YiA9IHRyYW5zZm9ybWI7XG5cbiAgICAgIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1hKTtcbiAgICAgIGlmICh0cmFuc2Zvcm1iICE9PSB1bmRlZmluZWQpIEFtbW8uZGVzdHJveSh0cmFuc2Zvcm1iKTtcblxuICAgICAgYnJlYWs7XG4gICAgfVxuICBkZWZhdWx0OlxuICAgIHJldHVybjtcbiAgfVxuXG4gIHdvcmxkLmFkZENvbnN0cmFpbnQoY29uc3RyYWludCk7XG5cbiAgY29uc3RyYWludC5hID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RhXTtcbiAgY29uc3RyYWludC5iID0gX29iamVjdHNbZGV0YWlscy5vYmplY3RiXTtcblxuICBjb25zdHJhaW50LmVuYWJsZUZlZWRiYWNrKCk7XG4gIF9jb25zdHJhaW50c1tkZXRhaWxzLmlkXSA9IGNvbnN0cmFpbnQ7XG4gIF9udW1fY29uc3RyYWludHMrKztcblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHtcbiAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheSgxICsgX251bV9jb25zdHJhaW50cyAqIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkUpOyAvLyBtZXNzYWdlIGlkICYgKCAjIG9mIG9iamVjdHMgdG8gcmVwb3J0ICogIyBvZiB2YWx1ZXMgcGVyIG9iamVjdCApXG4gICAgY29uc3RyYWludHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09OU1RSQUlOVFJFUE9SVDtcbiAgfVxuICBlbHNlIGNvbnN0cmFpbnRyZXBvcnQgPSBbTUVTU0FHRV9UWVBFUy5DT05TVFJBSU5UUkVQT1JUXTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMucmVtb3ZlQ29uc3RyYWludCA9IChkZXRhaWxzKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbZGV0YWlscy5pZF07XG5cbiAgaWYgKGNvbnN0cmFpbnQgIT09IHVuZGVmaW5lZCkge1xuICAgIHdvcmxkLnJlbW92ZUNvbnN0cmFpbnQoY29uc3RyYWludCk7XG4gICAgX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdID0gbnVsbDtcbiAgICBfbnVtX2NvbnN0cmFpbnRzLS07XG4gIH1cbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuY29uc3RyYWludF9zZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQgPSAoZGV0YWlscykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW2RldGFpbHMuaWRdO1xuICBpZiAoY29uc3RyYWludCAhPT0gdW5kZWZpbmVkKSBjb25zdHJhaW50LnNldEJyZWFraW5nSW1wdWxzZVRocmVzaG9sZChkZXRhaWxzLnRocmVzaG9sZCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNpbXVsYXRlID0gKHBhcmFtcyA9IHt9KSA9PiB7XG4gIGlmICh3b3JsZCkge1xuICAgIGlmIChwYXJhbXMudGltZVN0ZXAgJiYgcGFyYW1zLnRpbWVTdGVwIDwgZml4ZWRUaW1lU3RlcClcbiAgICAgIHBhcmFtcy50aW1lU3RlcCA9IGZpeGVkVGltZVN0ZXA7XG5cbiAgICBwYXJhbXMubWF4U3ViU3RlcHMgPSBwYXJhbXMubWF4U3ViU3RlcHMgfHwgTWF0aC5jZWlsKHBhcmFtcy50aW1lU3RlcCAvIGZpeGVkVGltZVN0ZXApOyAvLyBJZiBtYXhTdWJTdGVwcyBpcyBub3QgZGVmaW5lZCwga2VlcCB0aGUgc2ltdWxhdGlvbiBmdWxseSB1cCB0byBkYXRlXG5cbiAgICB3b3JsZC5zdGVwU2ltdWxhdGlvbihwYXJhbXMudGltZVN0ZXAsIHBhcmFtcy5tYXhTdWJTdGVwcywgZml4ZWRUaW1lU3RlcCk7XG5cbiAgICBpZiAoX3ZlaGljbGVzLmxlbmd0aCA+IDApIHJlcG9ydFZlaGljbGVzKCk7XG4gICAgcmVwb3J0Q29sbGlzaW9ucygpO1xuICAgIGlmIChfY29uc3RyYWludHMubGVuZ3RoID4gMCkgcmVwb3J0Q29uc3RyYWludHMoKTtcbiAgICByZXBvcnRXb3JsZCgpO1xuICAgIGlmIChfc29mdGJvZHlfZW5hYmxlZCkgcmVwb3J0V29ybGRfc29mdGJvZGllcygpO1xuICB9XG59O1xuXG4vLyBDb25zdHJhaW50IGZ1bmN0aW9uc1xucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9zZXRMaW1pdHMgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLmxvdywgcGFyYW1zLmhpZ2gsIDAsIHBhcmFtcy5iaWFzX2ZhY3RvciwgcGFyYW1zLnJlbGF4YXRpb25fZmFjdG9yKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuaGluZ2VfZW5hYmxlQW5ndWxhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVBbmd1bGFyTW90b3IodHJ1ZSwgcGFyYW1zLnZlbG9jaXR5LCBwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5oaW5nZV9kaXNhYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uZW5hYmxlTW90b3IoZmFsc2UpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX3NldExpbWl0cyA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0TG93ZXJMaW5MaW1pdChwYXJhbXMubGluX2xvd2VyIHx8IDApO1xuICBjb25zdHJhaW50LnNldFVwcGVyTGluTGltaXQocGFyYW1zLmxpbl91cHBlciB8fCAwKTtcblxuICBjb25zdHJhaW50LnNldExvd2VyQW5nTGltaXQocGFyYW1zLmFuZ19sb3dlciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRVcHBlckFuZ0xpbWl0KHBhcmFtcy5hbmdfdXBwZXIgfHwgMCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9zZXRSZXN0aXR1dGlvbiA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0U29mdG5lc3NMaW1MaW4ocGFyYW1zLmxpbmVhciB8fCAwKTtcbiAgY29uc3RyYWludC5zZXRTb2Z0bmVzc0xpbUFuZyhwYXJhbXMuYW5ndWxhciB8fCAwKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2VuYWJsZUxpbmVhck1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5zZXRUYXJnZXRMaW5Nb3RvclZlbG9jaXR5KHBhcmFtcy52ZWxvY2l0eSk7XG4gIGNvbnN0cmFpbnQuc2V0TWF4TGluTW90b3JGb3JjZShwYXJhbXMuYWNjZWxlcmF0aW9uKTtcbiAgY29uc3RyYWludC5zZXRQb3dlcmVkTGluTW90b3IodHJ1ZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuc2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZExpbk1vdG9yKGZhbHNlKTtcbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLnNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldFRhcmdldEFuZ01vdG9yVmVsb2NpdHkocGFyYW1zLnZlbG9jaXR5KTtcbiAgY29uc3RyYWludC5zZXRNYXhBbmdNb3RvckZvcmNlKHBhcmFtcy5hY2NlbGVyYXRpb24pO1xuICBjb25zdHJhaW50LnNldFBvd2VyZWRBbmdNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5zbGlkZXJfZGlzYWJsZUFuZ3VsYXJNb3RvciA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG4gIGNvbnN0cmFpbnQuc2V0UG93ZXJlZEFuZ01vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3Rfc2V0TGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF0uc2V0TGltaXQocGFyYW1zLnosIHBhcmFtcy55LCBwYXJhbXMueCk7IC8vIFpZWCBvcmRlclxufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZW5hYmxlTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LmVuYWJsZU1vdG9yKHRydWUpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNYXhNb3RvckltcHVsc2UgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuICBjb25zdHJhaW50LnNldE1heE1vdG9ySW1wdWxzZShwYXJhbXMubWF4X2ltcHVsc2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcbiAgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCA9IChwYXJhbXMpID0+IHtcbiAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1twYXJhbXMuY29uc3RyYWludF07XG5cbiAgX3F1YXQuc2V0WChwYXJhbXMueCk7XG4gIF9xdWF0LnNldFkocGFyYW1zLnkpO1xuICBfcXVhdC5zZXRaKHBhcmFtcy56KTtcbiAgX3F1YXQuc2V0VyhwYXJhbXMudyk7XG5cbiAgY29uc3RyYWludC5zZXRNb3RvclRhcmdldChfcXVhdCk7XG5cbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG4gIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5jb25ldHdpc3RfZGlzYWJsZU1vdG9yID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcbiAgY29uc3RyYWludC5lbmFibGVNb3RvcihmYWxzZSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuICBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhckxvd2VyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJMb3dlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldExpbmVhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRMaW5lYXJVcHBlckxpbWl0KF92ZWMzXzEpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX3NldEFuZ3VsYXJMb3dlckxpbWl0ID0gKHBhcmFtcykgPT4ge1xuICBjb25zdCBjb25zdHJhaW50ID0gX2NvbnN0cmFpbnRzW3BhcmFtcy5jb25zdHJhaW50XTtcblxuICBfdmVjM18xLnNldFgocGFyYW1zLngpO1xuICBfdmVjM18xLnNldFkocGFyYW1zLnkpO1xuICBfdmVjM18xLnNldFoocGFyYW1zLnopO1xuXG4gIGNvbnN0cmFpbnQuc2V0QW5ndWxhckxvd2VyTGltaXQoX3ZlYzNfMSk7XG4gIGNvbnN0cmFpbnQuYS5hY3RpdmF0ZSgpO1xuXG4gIGlmIChjb25zdHJhaW50LmIpIGNvbnN0cmFpbnQuYi5hY3RpdmF0ZSgpO1xufTtcblxucHVibGljX2Z1bmN0aW9ucy5kb2Zfc2V0QW5ndWxhclVwcGVyTGltaXQgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIF92ZWMzXzEuc2V0WChwYXJhbXMueCk7XG4gIF92ZWMzXzEuc2V0WShwYXJhbXMueSk7XG4gIF92ZWMzXzEuc2V0WihwYXJhbXMueik7XG5cbiAgY29uc3RyYWludC5zZXRBbmd1bGFyVXBwZXJMaW1pdChfdmVjM18xKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9lbmFibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdO1xuXG4gIGNvbnN0IG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuICBtb3Rvci5zZXRfbV9lbmFibGVNb3Rvcih0cnVlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5wdWJsaWNfZnVuY3Rpb25zLmRvZl9jb25maWd1cmVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2xvTGltaXQocGFyYW1zLmxvd19hbmdsZSk7XG4gIG1vdG9yLnNldF9tX2hpTGltaXQocGFyYW1zLmhpZ2hfYW5nbGUpO1xuICBtb3Rvci5zZXRfbV90YXJnZXRWZWxvY2l0eShwYXJhbXMudmVsb2NpdHkpO1xuICBtb3Rvci5zZXRfbV9tYXhNb3RvckZvcmNlKHBhcmFtcy5tYXhfZm9yY2UpO1xuICBjb25zdHJhaW50LmEuYWN0aXZhdGUoKTtcblxuICBpZiAoY29uc3RyYWludC5iKSBjb25zdHJhaW50LmIuYWN0aXZhdGUoKTtcbn07XG5cbnB1YmxpY19mdW5jdGlvbnMuZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IgPSAocGFyYW1zKSA9PiB7XG4gIGNvbnN0IGNvbnN0cmFpbnQgPSBfY29uc3RyYWludHNbcGFyYW1zLmNvbnN0cmFpbnRdLFxuICAgIG1vdG9yID0gY29uc3RyYWludC5nZXRSb3RhdGlvbmFsTGltaXRNb3RvcihwYXJhbXMud2hpY2gpO1xuXG4gIG1vdG9yLnNldF9tX2VuYWJsZU1vdG9yKGZhbHNlKTtcbiAgY29uc3RyYWludC5hLmFjdGl2YXRlKCk7XG5cbiAgaWYgKGNvbnN0cmFpbnQuYikgY29uc3RyYWludC5iLmFjdGl2YXRlKCk7XG59O1xuXG5jb25zdCByZXBvcnRXb3JsZCA9ICgpID0+IHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFICYmIHdvcmxkcmVwb3J0Lmxlbmd0aCA8IDIgKyBfbnVtX3JpZ2lkYm9keV9vYmplY3RzICogV09STERSRVBPUlRfSVRFTVNJWkUpIHtcbiAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICArXG4gICAgICAoTWF0aC5jZWlsKF9udW1fcmlnaWRib2R5X29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogV09STERSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgKTtcblxuICAgIHdvcmxkcmVwb3J0WzBdID0gTUVTU0FHRV9UWVBFUy5XT1JMRFJFUE9SVDtcbiAgfVxuXG4gIHdvcmxkcmVwb3J0WzFdID0gX251bV9yaWdpZGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBpID0gMCxcbiAgICAgIGluZGV4ID0gX29iamVjdHMubGVuZ3RoO1xuXG4gICAgd2hpbGUgKGluZGV4LS0pIHtcbiAgICAgIGNvbnN0IG9iamVjdCA9IF9vYmplY3RzW2luZGV4XTtcblxuICAgICAgaWYgKG9iamVjdCAmJiBvYmplY3QudHlwZSA9PT0gMSkgeyAvLyBSaWdpZEJvZGllcy5cbiAgICAgICAgLy8gI1RPRE86IHdlIGNhbid0IHVzZSBjZW50ZXIgb2YgbWFzcyB0cmFuc2Zvcm0gd2hlbiBjZW50ZXIgb2YgbWFzcyBjYW4gY2hhbmdlLFxuICAgICAgICAvLyAgICAgICAgYnV0IGdldE1vdGlvblN0YXRlKCkuZ2V0V29ybGRUcmFuc2Zvcm0oKSBzY3Jld3MgdXAgb24gb2JqZWN0cyB0aGF0IGhhdmUgYmVlbiBtb3ZlZFxuICAgICAgICAvLyBvYmplY3QuZ2V0TW90aW9uU3RhdGUoKS5nZXRXb3JsZFRyYW5zZm9ybSggdHJhbnNmb3JtICk7XG4gICAgICAgIC8vIG9iamVjdC5nZXRNb3Rpb25TdGF0ZSgpLmdldFdvcmxkVHJhbnNmb3JtKF90cmFuc2Zvcm0pO1xuXG4gICAgICAgIGNvbnN0IHRyYW5zZm9ybSA9IG9iamVjdC5nZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0oKTtcbiAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICBjb25zdCByb3RhdGlvbiA9IHRyYW5zZm9ybS5nZXRSb3RhdGlvbigpO1xuXG4gICAgICAgIC8vIGFkZCB2YWx1ZXMgdG8gcmVwb3J0XG4gICAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoaSsrKSAqIFdPUkxEUkVQT1JUX0lURU1TSVpFO1xuXG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldF0gPSBvYmplY3QuaWQ7XG5cbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBvcmlnaW4ueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAyXSA9IG9yaWdpbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDNdID0gb3JpZ2luLnooKTtcblxuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA0XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgNV0gPSByb3RhdGlvbi55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueigpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyA3XSA9IHJvdGF0aW9uLncoKTtcblxuICAgICAgICBfdmVjdG9yID0gb2JqZWN0LmdldExpbmVhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDhdID0gX3ZlY3Rvci54KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDldID0gX3ZlY3Rvci55KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDEwXSA9IF92ZWN0b3IueigpO1xuXG4gICAgICAgIF92ZWN0b3IgPSBvYmplY3QuZ2V0QW5ndWxhclZlbG9jaXR5KCk7XG4gICAgICAgIHdvcmxkcmVwb3J0W29mZnNldCArIDExXSA9IF92ZWN0b3IueCgpO1xuICAgICAgICB3b3JsZHJlcG9ydFtvZmZzZXQgKyAxMl0gPSBfdmVjdG9yLnkoKTtcbiAgICAgICAgd29ybGRyZXBvcnRbb2Zmc2V0ICsgMTNdID0gX3ZlY3Rvci56KCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSBzZW5kKHdvcmxkcmVwb3J0LmJ1ZmZlciwgW3dvcmxkcmVwb3J0LmJ1ZmZlcl0pO1xuICBlbHNlIHNlbmQod29ybGRyZXBvcnQpO1xufTtcblxuY29uc3QgcmVwb3J0V29ybGRfc29mdGJvZGllcyA9ICgpID0+IHtcbiAgLy8gVE9ETzogQWRkIFNVUFBPUlRUUkFOU0ZFUkFCTEUuXG5cbiAgc29mdHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICtcbiAgICBfbnVtX3NvZnRib2R5X29iamVjdHMgKiAyICtcbiAgICBfc29mdGJvZHlfcmVwb3J0X3NpemUgKiA2XG4gICk7XG5cbiAgc29mdHJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuU09GVFJFUE9SVDtcbiAgc29mdHJlcG9ydFsxXSA9IF9udW1fc29mdGJvZHlfb2JqZWN0czsgLy8gcmVjb3JkIGhvdyBtYW55IG9iamVjdHMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAyLFxuICAgICAgaW5kZXggPSBfb2JqZWN0cy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgY29uc3Qgb2JqZWN0ID0gX29iamVjdHNbaW5kZXhdO1xuXG4gICAgICBpZiAob2JqZWN0ICYmIG9iamVjdC50eXBlID09PSAwKSB7IC8vIFNvZnRCb2RpZXMuXG5cbiAgICAgICAgc29mdHJlcG9ydFtvZmZzZXRdID0gb2JqZWN0LmlkO1xuXG4gICAgICAgIGNvbnN0IG9mZnNldFZlcnQgPSBvZmZzZXQgKyAyO1xuXG4gICAgICAgIGlmIChvYmplY3Qucm9wZSA9PT0gdHJ1ZSkge1xuICAgICAgICAgIGNvbnN0IG5vZGVzID0gb2JqZWN0LmdldF9tX25vZGVzKCk7XG4gICAgICAgICAgY29uc3Qgc2l6ZSA9IG5vZGVzLnNpemUoKTtcbiAgICAgICAgICBzb2Z0cmVwb3J0W29mZnNldCArIDFdID0gc2l6ZTtcblxuICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBub2RlID0gbm9kZXMuYXQoaSk7XG4gICAgICAgICAgICBjb25zdCB2ZXJ0ID0gbm9kZS5nZXRfbV94KCk7XG4gICAgICAgICAgICBjb25zdCBvZmYgPSBvZmZzZXRWZXJ0ICsgaSAqIDM7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmXSA9IHZlcnQueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAyXSA9IHZlcnQueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogMyArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAob2JqZWN0LmNsb3RoKSB7XG4gICAgICAgICAgY29uc3Qgbm9kZXMgPSBvYmplY3QuZ2V0X21fbm9kZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gbm9kZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUgPSBub2Rlcy5hdChpKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQgPSBub2RlLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbCA9IG5vZGUuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiA2O1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZl0gPSB2ZXJ0LngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMV0gPSB2ZXJ0LnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0LnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAzXSA9IC1ub3JtYWwueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA0XSA9IC1ub3JtYWwueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA1XSA9IC1ub3JtYWwueigpO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIG9mZnNldCArPSBzaXplICogNiArIDI7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgY29uc3QgZmFjZXMgPSBvYmplY3QuZ2V0X21fZmFjZXMoKTtcbiAgICAgICAgICBjb25zdCBzaXplID0gZmFjZXMuc2l6ZSgpO1xuICAgICAgICAgIHNvZnRyZXBvcnRbb2Zmc2V0ICsgMV0gPSBzaXplO1xuXG4gICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGZhY2UgPSBmYWNlcy5hdChpKTtcblxuICAgICAgICAgICAgY29uc3Qgbm9kZTEgPSBmYWNlLmdldF9tX24oMCk7XG4gICAgICAgICAgICBjb25zdCBub2RlMiA9IGZhY2UuZ2V0X21fbigxKTtcbiAgICAgICAgICAgIGNvbnN0IG5vZGUzID0gZmFjZS5nZXRfbV9uKDIpO1xuXG4gICAgICAgICAgICBjb25zdCB2ZXJ0MSA9IG5vZGUxLmdldF9tX3goKTtcbiAgICAgICAgICAgIGNvbnN0IHZlcnQyID0gbm9kZTIuZ2V0X21feCgpO1xuICAgICAgICAgICAgY29uc3QgdmVydDMgPSBub2RlMy5nZXRfbV94KCk7XG5cbiAgICAgICAgICAgIGNvbnN0IG5vcm1hbDEgPSBub2RlMS5nZXRfbV9uKCk7XG4gICAgICAgICAgICBjb25zdCBub3JtYWwyID0gbm9kZTIuZ2V0X21fbigpO1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsMyA9IG5vZGUzLmdldF9tX24oKTtcblxuICAgICAgICAgICAgY29uc3Qgb2ZmID0gb2Zmc2V0VmVydCArIGkgKiAxODtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmZdID0gdmVydDEueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxXSA9IHZlcnQxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMl0gPSB2ZXJ0MS56KCk7XG5cbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgM10gPSBub3JtYWwxLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNF0gPSBub3JtYWwxLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgNV0gPSBub3JtYWwxLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyA2XSA9IHZlcnQyLngoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgN10gPSB2ZXJ0Mi55KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDhdID0gdmVydDIueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDldID0gbm9ybWFsMi54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEwXSA9IG5vcm1hbDIueSgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMV0gPSBub3JtYWwyLnooKTtcblxuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxMl0gPSB2ZXJ0My54KCk7XG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDEzXSA9IHZlcnQzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTRdID0gdmVydDMueigpO1xuXG4gICAgICAgICAgICBzb2Z0cmVwb3J0W29mZiArIDE1XSA9IG5vcm1hbDMueCgpO1xuICAgICAgICAgICAgc29mdHJlcG9ydFtvZmYgKyAxNl0gPSBub3JtYWwzLnkoKTtcbiAgICAgICAgICAgIHNvZnRyZXBvcnRbb2ZmICsgMTddID0gbm9ybWFsMy56KCk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgb2Zmc2V0ICs9IHNpemUgKiAxOCArIDI7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICAvLyBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHNlbmQoc29mdHJlcG9ydC5idWZmZXIsIFtzb2Z0cmVwb3J0LmJ1ZmZlcl0pO1xuICAvLyBlbHNlIHNlbmQoc29mdHJlcG9ydCk7XG4gIHNlbmQoc29mdHJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRDb2xsaXNpb25zID0gKCkgPT4ge1xuICBjb25zdCBkcCA9IHdvcmxkLmdldERpc3BhdGNoZXIoKSxcbiAgICBudW0gPSBkcC5nZXROdW1NYW5pZm9sZHMoKTtcbiAgLy8gX2NvbGxpZGVkID0gZmFsc2U7XG5cbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbGxpc2lvbnJlcG9ydC5sZW5ndGggPCAyICsgbnVtICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb2xsaXNpb25yZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KFxuICAgICAgICAyIC8vIG1lc3NhZ2UgaWQgJiAjIG9iamVjdHMgaW4gcmVwb3J0XG4gICAgICAgICtcbiAgICAgICAgKE1hdGguY2VpbChfbnVtX29iamVjdHMgLyBSRVBPUlRfQ0hVTktTSVpFKSAqIFJFUE9SVF9DSFVOS1NJWkUpICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuQ09MTElTSU9OUkVQT1JUO1xuICAgIH1cbiAgfVxuXG4gIGNvbGxpc2lvbnJlcG9ydFsxXSA9IDA7IC8vIGhvdyBtYW55IGNvbGxpc2lvbnMgd2UncmUgcmVwb3J0aW5nIG9uXG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBudW07IGkrKykge1xuICAgIGNvbnN0IG1hbmlmb2xkID0gZHAuZ2V0TWFuaWZvbGRCeUluZGV4SW50ZXJuYWwoaSksXG4gICAgICBudW1fY29udGFjdHMgPSBtYW5pZm9sZC5nZXROdW1Db250YWN0cygpO1xuXG4gICAgaWYgKG51bV9jb250YWN0cyA9PT0gMCkgY29udGludWU7XG5cbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IG51bV9jb250YWN0czsgaisrKSB7XG4gICAgICBjb25zdCBwdCA9IG1hbmlmb2xkLmdldENvbnRhY3RQb2ludChqKTtcblxuICAgICAgLy8gaWYgKCBwdC5nZXREaXN0YW5jZSgpIDwgMCApIHtcbiAgICAgIGNvbnN0IG9mZnNldCA9IDIgKyAoY29sbGlzaW9ucmVwb3J0WzFdKyspICogQ09MTElTSU9OUkVQT1JUX0lURU1TSVpFO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldF0gPSBfb2JqZWN0c19hbW1vW21hbmlmb2xkLmdldEJvZHkwKCkucHRyXTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAxXSA9IF9vYmplY3RzX2FtbW9bbWFuaWZvbGQuZ2V0Qm9keTEoKS5wdHJdO1xuXG4gICAgICBfdmVjdG9yID0gcHQuZ2V0X21fbm9ybWFsV29ybGRPbkIoKTtcbiAgICAgIGNvbGxpc2lvbnJlcG9ydFtvZmZzZXQgKyAyXSA9IF92ZWN0b3IueCgpO1xuICAgICAgY29sbGlzaW9ucmVwb3J0W29mZnNldCArIDNdID0gX3ZlY3Rvci55KCk7XG4gICAgICBjb2xsaXNpb25yZXBvcnRbb2Zmc2V0ICsgNF0gPSBfdmVjdG9yLnooKTtcbiAgICAgIGJyZWFrO1xuICAgICAgLy8gfVxuICAgICAgLy8gc2VuZChfb2JqZWN0c19hbW1vKTtcbiAgICB9XG4gIH1cblxuICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUpIHNlbmQoY29sbGlzaW9ucmVwb3J0LmJ1ZmZlciwgW2NvbGxpc2lvbnJlcG9ydC5idWZmZXJdKTtcbiAgZWxzZSBzZW5kKGNvbGxpc2lvbnJlcG9ydCk7XG59O1xuXG5jb25zdCByZXBvcnRWZWhpY2xlcyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKHZlaGljbGVyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fd2hlZWxzICogVkVISUNMRVJFUE9SVF9JVEVNU0laRSkge1xuICAgICAgdmVoaWNsZXJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoXG4gICAgICAgIDIgLy8gbWVzc2FnZSBpZCAmICMgb2JqZWN0cyBpbiByZXBvcnRcbiAgICAgICAgK1xuICAgICAgICAoTWF0aC5jZWlsKF9udW1fd2hlZWxzIC8gUkVQT1JUX0NIVU5LU0laRSkgKiBSRVBPUlRfQ0hVTktTSVpFKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUgLy8gIyBvZiB2YWx1ZXMgbmVlZGVkICogaXRlbSBzaXplXG4gICAgICApO1xuICAgICAgdmVoaWNsZXJlcG9ydFswXSA9IE1FU1NBR0VfVFlQRVMuVkVISUNMRVJFUE9SVDtcbiAgICB9XG4gIH1cblxuICB7XG4gICAgbGV0IGkgPSAwLFxuICAgICAgaiA9IDAsXG4gICAgICBpbmRleCA9IF92ZWhpY2xlcy5sZW5ndGg7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF92ZWhpY2xlc1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgdmVoaWNsZSA9IF92ZWhpY2xlc1tpbmRleF07XG5cbiAgICAgICAgZm9yIChqID0gMDsgaiA8IHZlaGljbGUuZ2V0TnVtV2hlZWxzKCk7IGorKykge1xuICAgICAgICAgIC8vIHZlaGljbGUudXBkYXRlV2hlZWxUcmFuc2Zvcm0oIGosIHRydWUgKTtcbiAgICAgICAgICAvLyB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsVHJhbnNmb3JtV1MoIGogKTtcbiAgICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSB2ZWhpY2xlLmdldFdoZWVsSW5mbyhqKS5nZXRfbV93b3JsZFRyYW5zZm9ybSgpO1xuXG4gICAgICAgICAgY29uc3Qgb3JpZ2luID0gdHJhbnNmb3JtLmdldE9yaWdpbigpO1xuICAgICAgICAgIGNvbnN0IHJvdGF0aW9uID0gdHJhbnNmb3JtLmdldFJvdGF0aW9uKCk7XG5cbiAgICAgICAgICAvLyBhZGQgdmFsdWVzIHRvIHJlcG9ydFxuICAgICAgICAgIGNvbnN0IG9mZnNldCA9IDEgKyAoaSsrKSAqIFZFSElDTEVSRVBPUlRfSVRFTVNJWkU7XG5cbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDFdID0gajtcblxuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgMl0gPSBvcmlnaW4ueCgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgNF0gPSBvcmlnaW4ueigpO1xuXG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA1XSA9IHJvdGF0aW9uLngoKTtcbiAgICAgICAgICB2ZWhpY2xlcmVwb3J0W29mZnNldCArIDZdID0gcm90YXRpb24ueSgpO1xuICAgICAgICAgIHZlaGljbGVyZXBvcnRbb2Zmc2V0ICsgN10gPSByb3RhdGlvbi56KCk7XG4gICAgICAgICAgdmVoaWNsZXJlcG9ydFtvZmZzZXQgKyA4XSA9IHJvdGF0aW9uLncoKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChTVVBQT1JUX1RSQU5TRkVSQUJMRSAmJiBqICE9PSAwKSBzZW5kKHZlaGljbGVyZXBvcnQuYnVmZmVyLCBbdmVoaWNsZXJlcG9ydC5idWZmZXJdKTtcbiAgICBlbHNlIGlmIChqICE9PSAwKSBzZW5kKHZlaGljbGVyZXBvcnQpO1xuICB9XG59O1xuXG5jb25zdCByZXBvcnRDb25zdHJhaW50cyA9IGZ1bmN0aW9uICgpIHtcbiAgaWYgKFNVUFBPUlRfVFJBTlNGRVJBQkxFKSB7XG4gICAgaWYgKGNvbnN0cmFpbnRyZXBvcnQubGVuZ3RoIDwgMiArIF9udW1fY29uc3RyYWludHMgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFKSB7XG4gICAgICBjb25zdHJhaW50cmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShcbiAgICAgICAgMiAvLyBtZXNzYWdlIGlkICYgIyBvYmplY3RzIGluIHJlcG9ydFxuICAgICAgICArXG4gICAgICAgIChNYXRoLmNlaWwoX251bV9jb25zdHJhaW50cyAvIFJFUE9SVF9DSFVOS1NJWkUpICogUkVQT1JUX0NIVU5LU0laRSkgKiBDT05TVFJBSU5UUkVQT1JUX0lURU1TSVpFIC8vICMgb2YgdmFsdWVzIG5lZWRlZCAqIGl0ZW0gc2l6ZVxuICAgICAgKTtcbiAgICAgIGNvbnN0cmFpbnRyZXBvcnRbMF0gPSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ7XG4gICAgfVxuICB9XG5cbiAge1xuICAgIGxldCBvZmZzZXQgPSAwLFxuICAgICAgaSA9IDAsXG4gICAgICBpbmRleCA9IF9jb25zdHJhaW50cy5sZW5naHQ7XG5cbiAgICB3aGlsZSAoaW5kZXgtLSkge1xuICAgICAgaWYgKF9jb25zdHJhaW50c1tpbmRleF0pIHtcbiAgICAgICAgY29uc3QgY29uc3RyYWludCA9IF9jb25zdHJhaW50c1tpbmRleF07XG4gICAgICAgIGNvbnN0IG9mZnNldF9ib2R5ID0gY29uc3RyYWludC5hO1xuICAgICAgICBjb25zdCB0cmFuc2Zvcm0gPSBjb25zdHJhaW50LnRhO1xuICAgICAgICBjb25zdCBvcmlnaW4gPSB0cmFuc2Zvcm0uZ2V0T3JpZ2luKCk7XG5cbiAgICAgICAgLy8gYWRkIHZhbHVlcyB0byByZXBvcnRcbiAgICAgICAgb2Zmc2V0ID0gMSArIChpKyspICogQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRTtcblxuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldF0gPSBpbmRleDtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyAxXSA9IG9mZnNldF9ib2R5LmlkO1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDJdID0gb3JpZ2luLng7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnRbb2Zmc2V0ICsgM10gPSBvcmlnaW4ueTtcbiAgICAgICAgY29uc3RyYWludHJlcG9ydFtvZmZzZXQgKyA0XSA9IG9yaWdpbi56O1xuICAgICAgICBjb25zdHJhaW50cmVwb3J0W29mZnNldCArIDVdID0gY29uc3RyYWludC5nZXRCcmVha2luZ0ltcHVsc2VUaHJlc2hvbGQoKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoU1VQUE9SVF9UUkFOU0ZFUkFCTEUgJiYgaSAhPT0gMCkgc2VuZChjb25zdHJhaW50cmVwb3J0LmJ1ZmZlciwgW2NvbnN0cmFpbnRyZXBvcnQuYnVmZmVyXSk7XG4gICAgZWxzZSBpZiAoaSAhPT0gMCkgc2VuZChjb25zdHJhaW50cmVwb3J0KTtcbiAgfVxufTtcblxuc2VsZi5vbm1lc3NhZ2UgPSBmdW5jdGlvbiAoZXZlbnQpIHtcbiAgaWYgKGV2ZW50LmRhdGEgaW5zdGFuY2VvZiBGbG9hdDMyQXJyYXkpIHtcbiAgICAvLyB0cmFuc2ZlcmFibGUgb2JqZWN0XG4gICAgc3dpdGNoIChldmVudC5kYXRhWzBdKSB7XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLldPUkxEUkVQT1JUOlxuICAgICAge1xuICAgICAgICB3b3JsZHJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5DT0xMSVNJT05SRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIGNvbGxpc2lvbnJlcG9ydCA9IG5ldyBGbG9hdDMyQXJyYXkoZXZlbnQuZGF0YSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIGNhc2UgTUVTU0FHRV9UWVBFUy5WRUhJQ0xFUkVQT1JUOlxuICAgICAge1xuICAgICAgICB2ZWhpY2xlcmVwb3J0ID0gbmV3IEZsb2F0MzJBcnJheShldmVudC5kYXRhKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgY2FzZSBNRVNTQUdFX1RZUEVTLkNPTlNUUkFJTlRSRVBPUlQ6XG4gICAgICB7XG4gICAgICAgIGNvbnN0cmFpbnRyZXBvcnQgPSBuZXcgRmxvYXQzMkFycmF5KGV2ZW50LmRhdGEpO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICBkZWZhdWx0OlxuICAgIH1cblxuICAgIHJldHVybjtcbiAgfVxuICBlbHNlIGlmIChldmVudC5kYXRhLmNtZCAmJiBwdWJsaWNfZnVuY3Rpb25zW2V2ZW50LmRhdGEuY21kXSkgcHVibGljX2Z1bmN0aW9uc1tldmVudC5kYXRhLmNtZF0oZXZlbnQuZGF0YS5wYXJhbXMpO1xufTtcblxuc2VsZi5yZWNlaXZlID0gc2VsZi5vbm1lc3NhZ2U7XG5cblxuXG5cbn0pOyIsImltcG9ydCBXb3JsZE1vZHVsZUJhc2UgZnJvbSAnLi9jb3JlL1dvcmxkTW9kdWxlQmFzZSc7XG5cbmltcG9ydCB7XG4gIGFkZE9iamVjdENoaWxkcmVuLFxuICBNRVNTQUdFX1RZUEVTLFxuICB0ZW1wMVZlY3RvcjMsXG4gIHRlbXAxTWF0cml4NCxcbiAgUkVQT1JUX0lURU1TSVpFLFxuICBDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUsXG4gIFZFSElDTEVSRVBPUlRfSVRFTVNJWkUsXG4gIENPTlNUUkFJTlRSRVBPUlRfSVRFTVNJWkVcbn0gZnJvbSAnLi4vYXBpJztcblxuaW1wb3J0IFBoeXNpY3NXb3JrZXIgZnJvbSAnd29ya2VyIS4uL3dvcmtlci5qcyc7XG5cbmV4cG9ydCBjbGFzcyBXb3JsZE1vZHVsZSBleHRlbmRzIFdvcmxkTW9kdWxlQmFzZSB7XG4gIGNvbnN0cnVjdG9yKC4uLmFyZ3MpIHtcbiAgICBzdXBlciguLi5hcmdzKTtcblxuICAgIHRoaXMud29ya2VyID0gbmV3IFBoeXNpY3NXb3JrZXIoKTtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlID0gdGhpcy53b3JrZXIud2Via2l0UG9zdE1lc3NhZ2UgfHwgdGhpcy53b3JrZXIucG9zdE1lc3NhZ2U7XG5cbiAgICB0aGlzLmlzTG9hZGVkID0gZmFsc2U7XG5cbiAgICBjb25zdCBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuXG4gICAgdGhpcy5sb2FkZXIgPSBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgICAvLyBpZiAob3B0aW9ucy53YXNtKSB7XG4gICAgICAvLyAgIGZldGNoKG9wdGlvbnMud2FzbSlcbiAgICAgIC8vICAgICAudGhlbihyZXNwb25zZSA9PiByZXNwb25zZS5hcnJheUJ1ZmZlcigpKVxuICAgICAgLy8gICAgIC50aGVuKGJ1ZmZlciA9PiB7XG4gICAgICAvLyAgICAgICBvcHRpb25zLndhc21CdWZmZXIgPSBidWZmZXI7XG4gICAgICAvL1xuICAgICAgLy8gICAgICAgdGhpcy5leGVjdXRlKCdpbml0Jywgb3B0aW9ucyk7XG4gICAgICAvLyAgICAgICByZXNvbHZlKCk7XG4gICAgICAvLyAgICAgfSk7XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgICB0aGlzLmV4ZWN1dGUoJ2luaXQnLCBvcHRpb25zKTtcbiAgICAgICAgcmVzb2x2ZSgpO1xuICAgICAgLy8gfVxuICAgIH0pO1xuXG4gICAgdGhpcy5sb2FkZXIudGhlbigoKSA9PiB7dGhpcy5pc0xvYWRlZCA9IHRydWV9KTtcblxuICAgIC8vIFRlc3QgU1VQUE9SVF9UUkFOU0ZFUkFCTEVcblxuICAgIGNvbnN0IGFiID0gbmV3IEFycmF5QnVmZmVyKDEpO1xuICAgIHRoaXMud29ya2VyLnRyYW5zZmVyYWJsZU1lc3NhZ2UoYWIsIFthYl0pO1xuICAgIHRoaXMuU1VQUE9SVF9UUkFOU0ZFUkFCTEUgPSAoYWIuYnl0ZUxlbmd0aCA9PT0gMCk7XG5cbiAgICB0aGlzLnNldHVwKCk7XG4gIH1cblxuICBzZW5kKC4uLmFyZ3MpIHtcbiAgICB0aGlzLndvcmtlci50cmFuc2ZlcmFibGVNZXNzYWdlKC4uLmFyZ3MpO1xuICB9XG5cbiAgcmVjZWl2ZShjYWxsYmFjaykge1xuICAgIHRoaXMud29ya2VyLmFkZEV2ZW50TGlzdGVuZXIoJ21lc3NhZ2UnLCBjYWxsYmFjayk7XG4gIH1cbn1cbiIsImltcG9ydCB7VmVjdG9yMywgUXVhdGVybmlvbn0gZnJvbSAndGhyZWUnO1xuXG5jb25zdCBwcm9wZXJ0aWVzID0ge1xuICBwb3NpdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHJldHVybiB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgfSxcblxuICAgIHNldCh2ZWN0b3IzKSB7XG4gICAgICBjb25zdCBwb3MgPSB0aGlzLl9uYXRpdmUucG9zaXRpb247XG4gICAgICBjb25zdCBzY29wZSA9IHRoaXM7XG5cbiAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0aWVzKHBvcywge1xuICAgICAgICB4OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3g7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh4KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feCA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB5OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3k7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh5KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feSA9IHk7XG4gICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICB6OiB7XG4gICAgICAgICAgZ2V0KCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuX3o7XG4gICAgICAgICAgfSxcblxuICAgICAgICAgIHNldCh6KSB7XG4gICAgICAgICAgICBzY29wZS5fX2RpcnR5UG9zaXRpb24gPSB0cnVlO1xuICAgICAgICAgICAgdGhpcy5feiA9IHo7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgc2NvcGUuX19kaXJ0eVBvc2l0aW9uID0gdHJ1ZTtcblxuICAgICAgcG9zLmNvcHkodmVjdG9yMyk7XG4gICAgfVxuICB9LFxuXG4gIHF1YXRlcm5pb246IHtcbiAgICBnZXQoKSB7XG4gICAgICB0aGlzLl9fY19yb3QgPSB0cnVlO1xuICAgICAgcmV0dXJuIHRoaXMubmF0aXZlLnF1YXRlcm5pb247XG4gICAgfSxcblxuICAgIHNldChxdWF0ZXJuaW9uKSB7XG4gICAgICBjb25zdCBxdWF0ID0gdGhpcy5fbmF0aXZlLnF1YXRlcm5pb24sXG4gICAgICAgIG5hdGl2ZSA9IHRoaXMuX25hdGl2ZTtcblxuICAgICAgcXVhdC5jb3B5KHF1YXRlcm5pb24pO1xuXG4gICAgICBxdWF0Lm9uQ2hhbmdlKCgpID0+IHtcbiAgICAgICAgaWYgKHRoaXMuX19jX3JvdCkge1xuICAgICAgICAgIGlmIChuYXRpdmUuX19kaXJ0eVJvdGF0aW9uID09PSB0cnVlKSB7XG4gICAgICAgICAgICB0aGlzLl9fY19yb3QgPSBmYWxzZTtcbiAgICAgICAgICAgIG5hdGl2ZS5fX2RpcnR5Um90YXRpb24gPSBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfSxcblxuICByb3RhdGlvbjoge1xuICAgIGdldCgpIHtcbiAgICAgIHRoaXMuX19jX3JvdCA9IHRydWU7XG4gICAgICByZXR1cm4gdGhpcy5fbmF0aXZlLnJvdGF0aW9uO1xuICAgIH0sXG5cbiAgICBzZXQoZXVsZXIpIHtcbiAgICAgIGNvbnN0IHJvdCA9IHRoaXMuX25hdGl2ZS5yb3RhdGlvbixcbiAgICAgICAgbmF0aXZlID0gdGhpcy5fbmF0aXZlO1xuXG4gICAgICB0aGlzLnF1YXRlcm5pb24uY29weShuZXcgUXVhdGVybmlvbigpLnNldEZyb21FdWxlcihldWxlcikpO1xuXG4gICAgICByb3Qub25DaGFuZ2UoKCkgPT4ge1xuICAgICAgICBpZiAodGhpcy5fX2Nfcm90KSB7XG4gICAgICAgICAgdGhpcy5xdWF0ZXJuaW9uLmNvcHkobmV3IFF1YXRlcm5pb24oKS5zZXRGcm9tRXVsZXIocm90KSk7XG4gICAgICAgICAgbmF0aXZlLl9fZGlydHlSb3RhdGlvbiA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICAgIH1cbiAgfVxufVxuXG5mdW5jdGlvbiB3cmFwUGh5c2ljc1Byb3RvdHlwZShzY29wZSkge1xuICBmb3IgKGxldCBrZXkgaW4gcHJvcGVydGllcykge1xuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShzY29wZSwga2V5LCB7XG4gICAgICBnZXQ6IHByb3BlcnRpZXNba2V5XS5nZXQuYmluZChzY29wZSksXG4gICAgICBzZXQ6IHByb3BlcnRpZXNba2V5XS5zZXQuYmluZChzY29wZSksXG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlXG4gICAgfSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb25Db3B5KHNvdXJjZSkge1xuICB3cmFwUGh5c2ljc1Byb3RvdHlwZSh0aGlzKTtcblxuICBjb25zdCBwaHlzaWNzID0gdGhpcy51c2UoJ3BoeXNpY3MnKTtcbiAgY29uc3Qgc291cmNlUGh5c2ljcyA9IHNvdXJjZS51c2UoJ3BoeXNpY3MnKTtcblxuICB0aGlzLm1hbmFnZXIubW9kdWxlcy5waHlzaWNzID0gcGh5c2ljcy5jbG9uZSh0aGlzLm1hbmFnZXIpO1xuXG4gIHBoeXNpY3MuZGF0YSA9IHsuLi5zb3VyY2VQaHlzaWNzLmRhdGF9O1xuICBwaHlzaWNzLmRhdGEuaXNTb2Z0Qm9keVJlc2V0ID0gZmFsc2U7XG4gIGlmIChwaHlzaWNzLmRhdGEuaXNTb2Z0Ym9keSkgcGh5c2ljcy5kYXRhLmlzU29mdEJvZHlSZXNldCA9IGZhbHNlO1xuXG4gIHRoaXMucG9zaXRpb24gPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XG4gIHRoaXMucm90YXRpb24gPSB0aGlzLnJvdGF0aW9uLmNsb25lKCk7XG4gIHRoaXMucXVhdGVybmlvbiA9IHRoaXMucXVhdGVybmlvbi5jbG9uZSgpO1xuXG4gIHJldHVybiBzb3VyY2U7XG59XG5cbmZ1bmN0aW9uIG9uV3JhcCgpIHtcbiAgdGhpcy5wb3NpdGlvbiA9IHRoaXMucG9zaXRpb24uY2xvbmUoKTtcbiAgdGhpcy5yb3RhdGlvbiA9IHRoaXMucm90YXRpb24uY2xvbmUoKTtcbiAgdGhpcy5xdWF0ZXJuaW9uID0gdGhpcy5xdWF0ZXJuaW9uLmNsb25lKCk7XG59XG5cbmNsYXNzIEFQSSB7XG4gIGFwcGx5Q2VudHJhbEltcHVsc2UoZm9yY2UpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5Q2VudHJhbEltcHVsc2UnLCB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZm9yY2UueCwgeTogZm9yY2UueSwgejogZm9yY2Uuen0pO1xuICB9XG5cbiAgYXBwbHlJbXB1bHNlKGZvcmNlLCBvZmZzZXQpIHtcbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGx5SW1wdWxzZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBpbXB1bHNlX3g6IGZvcmNlLngsXG4gICAgICBpbXB1bHNlX3k6IGZvcmNlLnksXG4gICAgICBpbXB1bHNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5VG9ycXVlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseVRvcnF1ZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB0b3JxdWVfeDogZm9yY2UueCxcbiAgICAgIHRvcnF1ZV95OiBmb3JjZS55LFxuICAgICAgdG9ycXVlX3o6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Q2VudHJhbEZvcmNlKGZvcmNlKSB7XG4gICAgdGhpcy5leGVjdXRlKCdhcHBseUNlbnRyYWxGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICB4OiBmb3JjZS54LFxuICAgICAgeTogZm9yY2UueSxcbiAgICAgIHo6IGZvcmNlLnpcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGx5Rm9yY2UoZm9yY2UsIG9mZnNldCkge1xuICAgIHRoaXMuZXhlY3V0ZSgnYXBwbHlGb3JjZScsIHtcbiAgICAgIGlkOiB0aGlzLmRhdGEuaWQsXG4gICAgICBmb3JjZV94OiBmb3JjZS54LFxuICAgICAgZm9yY2VfeTogZm9yY2UueSxcbiAgICAgIGZvcmNlX3o6IGZvcmNlLnosXG4gICAgICB4OiBvZmZzZXQueCxcbiAgICAgIHk6IG9mZnNldC55LFxuICAgICAgejogb2Zmc2V0LnpcbiAgICB9KTtcbiAgfVxuXG4gIGdldEFuZ3VsYXJWZWxvY2l0eSgpIHtcbiAgICByZXR1cm4gdGhpcy5kYXRhLmFuZ3VsYXJWZWxvY2l0eTtcbiAgfVxuXG4gIHNldEFuZ3VsYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRBbmd1bGFyVmVsb2NpdHknLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IHZlbG9jaXR5LngsIHk6IHZlbG9jaXR5LnksIHo6IHZlbG9jaXR5Lnp9XG4gICAgKTtcbiAgfVxuXG4gIGdldExpbmVhclZlbG9jaXR5KCkge1xuICAgIHJldHVybiB0aGlzLmRhdGEubGluZWFyVmVsb2NpdHk7XG4gIH1cblxuICBzZXRMaW5lYXJWZWxvY2l0eSh2ZWxvY2l0eSkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJWZWxvY2l0eScsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogdmVsb2NpdHkueCwgeTogdmVsb2NpdHkueSwgejogdmVsb2NpdHkuen1cbiAgICApO1xuICB9XG5cbiAgc2V0QW5ndWxhckZhY3RvcihmYWN0b3IpIHtcbiAgICB0aGlzLmV4ZWN1dGUoXG4gICAgICAnc2V0QW5ndWxhckZhY3RvcicsXG4gICAgICB7aWQ6IHRoaXMuZGF0YS5pZCwgeDogZmFjdG9yLngsIHk6IGZhY3Rvci55LCB6OiBmYWN0b3Iuen1cbiAgICApO1xuICB9XG5cbiAgc2V0TGluZWFyRmFjdG9yKGZhY3Rvcikge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRMaW5lYXJGYWN0b3InLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHg6IGZhY3Rvci54LCB5OiBmYWN0b3IueSwgejogZmFjdG9yLnp9XG4gICAgKTtcbiAgfVxuXG4gIHNldERhbXBpbmcobGluZWFyLCBhbmd1bGFyKSB7XG4gICAgdGhpcy5leGVjdXRlKFxuICAgICAgJ3NldERhbXBpbmcnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIGxpbmVhciwgYW5ndWxhcn1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkTW90aW9uVGhyZXNob2xkKHRocmVzaG9sZCkge1xuICAgIHRoaXMuZXhlY3V0ZShcbiAgICAgICdzZXRDY2RNb3Rpb25UaHJlc2hvbGQnLFxuICAgICAge2lkOiB0aGlzLmRhdGEuaWQsIHRocmVzaG9sZH1cbiAgICApO1xuICB9XG5cbiAgc2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMocmFkaXVzKSB7XG4gICAgdGhpcy5leGVjdXRlKCdzZXRDY2RTd2VwdFNwaGVyZVJhZGl1cycsIHtpZDogdGhpcy5kYXRhLmlkLCByYWRpdXN9KTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBleHRlbmRzIEFQSSB7XG4gIHN0YXRpYyByaWdpZGJvZHkgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGxpbmVhclZlbG9jaXR5OiBuZXcgVmVjdG9yMygpLFxuICAgIGFuZ3VsYXJWZWxvY2l0eTogbmV3IFZlY3RvcjMoKSxcbiAgICBtYXNzOiAxMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwXG4gIH0pO1xuXG4gIHN0YXRpYyBzb2Z0Ym9keSA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgcmVzdGl0dXRpb246IDAuMyxcbiAgICBmcmljdGlvbjogMC44LFxuICAgIGRhbXBpbmc6IDAsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIHByZXNzdXJlOiAxMDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlLFxuICAgIGlzU29mdEJvZHlSZXNldDogZmFsc2VcbiAgfSk7XG5cbiAgc3RhdGljIHJvcGUgPSAoKSA9PiAoe1xuICAgIHRvdWNoZXM6IFtdLFxuICAgIGZyaWN0aW9uOiAwLjgsXG4gICAgc2NhbGU6IG5ldyBWZWN0b3IzKDEsIDEsIDEpLFxuICAgIGRhbXBpbmc6IDAsXG4gICAgbWFyZ2luOiAwLFxuICAgIGtsc3Q6IDAuOSxcbiAgICBrdnN0OiAwLjksXG4gICAga2FzdDogMC45LFxuICAgIHBpdGVyYXRpb25zOiAxLFxuICAgIHZpdGVyYXRpb25zOiAwLFxuICAgIGRpdGVyYXRpb25zOiAwLFxuICAgIGNpdGVyYXRpb25zOiA0LFxuICAgIGFuY2hvckhhcmRuZXNzOiAwLjcsXG4gICAgcmlnaWRIYXJkbmVzczogMSxcbiAgICBpc1NvZnRib2R5OiB0cnVlXG4gIH0pO1xuXG4gIHN0YXRpYyBjbG90aCA9ICgpID0+ICh7XG4gICAgdG91Y2hlczogW10sXG4gICAgZnJpY3Rpb246IDAuOCxcbiAgICBkYW1waW5nOiAwLFxuICAgIG1hcmdpbjogMCxcbiAgICBzY2FsZTogbmV3IFZlY3RvcjMoMSwgMSwgMSksXG4gICAga2xzdDogMC45LFxuICAgIGt2c3Q6IDAuOSxcbiAgICBrYXN0OiAwLjksXG4gICAgcGl0ZXJhdGlvbnM6IDEsXG4gICAgdml0ZXJhdGlvbnM6IDAsXG4gICAgZGl0ZXJhdGlvbnM6IDAsXG4gICAgY2l0ZXJhdGlvbnM6IDQsXG4gICAgYW5jaG9ySGFyZG5lc3M6IDAuNyxcbiAgICByaWdpZEhhcmRuZXNzOiAxXG4gIH0pO1xuXG4gIGNvbnN0cnVjdG9yKGRlZmF1bHRzLCBkYXRhKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLmRhdGEgPSBPYmplY3QuYXNzaWduKGRlZmF1bHRzLCBkYXRhKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgd3JhcFBoeXNpY3NQcm90b3R5cGUodGhpcyk7XG4gIH1cblxuICBtYW5hZ2VyKG1hbmFnZXIpIHtcbiAgICBtYW5hZ2VyLmRlZmluZSgncGh5c2ljcycpO1xuXG4gICAgdGhpcy5leGVjdXRlID0gKC4uLmRhdGEpID0+IHtcbiAgICAgIHJldHVybiBtYW5hZ2VyLmhhcygnbW9kdWxlOndvcmxkJylcbiAgICAgID8gbWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmV4ZWN1dGUoLi4uZGF0YSlcbiAgICAgIDogKCkgPT4ge307XG4gICAgfTtcbiAgfVxuXG4gIHVwZGF0ZURhdGEoY2FsbGJhY2spIHtcbiAgICB0aGlzLmJyaWRnZS5nZW9tZXRyeSA9IGZ1bmN0aW9uIChnZW9tZXRyeSwgbW9kdWxlKSB7XG4gICAgICBpZiAoIWNhbGxiYWNrKSByZXR1cm4gZ2VvbWV0cnk7XG5cbiAgICAgIGNvbnN0IHJlc3VsdCA9IGNhbGxiYWNrKGdlb21ldHJ5LCBtb2R1bGUpO1xuICAgICAgcmV0dXJuIHJlc3VsdCA/IHJlc3VsdCA6IGdlb21ldHJ5O1xuICAgIH1cbiAgfVxuXG4gIGNsb25lKG1hbmFnZXIpIHtcbiAgICBjb25zdCBjbG9uZSA9IG5ldyB0aGlzLmNvbnN0cnVjdG9yKCk7XG4gICAgY2xvbmUuZGF0YSA9IHsuLi50aGlzLmRhdGF9O1xuICAgIGNsb25lLmJyaWRnZS5nZW9tZXRyeSA9IHRoaXMuYnJpZGdlLmdlb21ldHJ5O1xuICAgIHRoaXMubWFuYWdlci5hcHBseShjbG9uZSwgW21hbmFnZXJdKTtcblxuICAgIHJldHVybiBjbG9uZTtcbiAgfVxuXG4gIGJyaWRnZSA9IHtcbiAgICBvbkNvcHksXG4gICAgb25XcmFwXG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBCb3hNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2JveCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZGF0YS5kZXB0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb21wb3VuZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnY29tcG91bmQnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuLy8gVE9ETzogVGVzdCBDYXBzdWxlTW9kdWxlIGluIGFjdGlvbi5cbmV4cG9ydCBjbGFzcyBDYXBzdWxlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjYXBzdWxlJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS53aWR0aCA9IGRhdGEud2lkdGggfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueDtcbiAgICAgIGRhdGEuaGVpZ2h0ID0gZGF0YS5oZWlnaHQgfHwgZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnkgLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueTtcbiAgICAgIGRhdGEuZGVwdGggPSBkYXRhLmRlcHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIENvbmNhdmVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbmNhdmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGRhdGEuZGF0YSA9IHRoaXMuZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpO1xuICAgIH0pO1xuICB9XG5cbiAgZ2VvbWV0cnlQcm9jZXNzb3IoZ2VvbWV0cnkpIHtcbiAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgIGNvbnN0IGRhdGEgPSBnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5ID9cbiAgICAgIGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOlxuICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiA5KTtcblxuICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgY29uc3QgdmVydGljZXMgPSBnZW9tZXRyeS52ZXJ0aWNlcztcblxuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBnZW9tZXRyeS5mYWNlcy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBmYWNlID0gZ2VvbWV0cnkuZmFjZXNbaV07XG5cbiAgICAgICAgY29uc3QgdkEgPSB2ZXJ0aWNlc1tmYWNlLmFdO1xuICAgICAgICBjb25zdCB2QiA9IHZlcnRpY2VzW2ZhY2UuYl07XG4gICAgICAgIGNvbnN0IHZDID0gdmVydGljZXNbZmFjZS5jXTtcblxuICAgICAgICBjb25zdCBpOSA9IGkgKiA5O1xuXG4gICAgICAgIGRhdGFbaTldID0gdkEueDtcbiAgICAgICAgZGF0YVtpOSArIDFdID0gdkEueTtcbiAgICAgICAgZGF0YVtpOSArIDJdID0gdkEuejtcblxuICAgICAgICBkYXRhW2k5ICsgM10gPSB2Qi54O1xuICAgICAgICBkYXRhW2k5ICsgNF0gPSB2Qi55O1xuICAgICAgICBkYXRhW2k5ICsgNV0gPSB2Qi56O1xuXG4gICAgICAgIGRhdGFbaTkgKyA2XSA9IHZDLng7XG4gICAgICAgIGRhdGFbaTkgKyA3XSA9IHZDLnk7XG4gICAgICAgIGRhdGFbaTkgKyA4XSA9IHZDLno7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmV0dXJuIGRhdGE7XG4gIH07XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb25lTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjb25lJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUucmlnaWRib2R5KClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBpZiAoIWdlb21ldHJ5LmJvdW5kaW5nQm94KSBnZW9tZXRyeS5jb21wdXRlQm91bmRpbmdCb3goKTtcblxuICAgICAgZGF0YS5yYWRpdXMgPSBkYXRhLnJhZGl1cyB8fCAoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnggLSBnZW9tZXRyeS5ib3VuZGluZ0JveC5taW4ueCkgLyAyO1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5pbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBDb252ZXhNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ2NvbnZleCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG4gICAgICBpZiAoIWdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkpIGdlb21ldHJ5Ll9idWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG5cbiAgICAgIGRhdGEuZGF0YSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnkgP1xuICAgICAgICBnZW9tZXRyeS5hdHRyaWJ1dGVzLnBvc2l0aW9uLmFycmF5IDpcbiAgICAgICAgZ2VvbWV0cnkuX2J1ZmZlckdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXk7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIEN5bGluZGVyTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdjeWxpbmRlcicsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJpZ2lkYm9keSgpXG4gICAgfSwgcGFyYW1zKTtcblxuICAgIHRoaXMudXBkYXRlRGF0YSgoZ2VvbWV0cnksIHtkYXRhfSkgPT4ge1xuICAgICAgaWYgKCFnZW9tZXRyeS5ib3VuZGluZ0JveCkgZ2VvbWV0cnkuY29tcHV0ZUJvdW5kaW5nQm94KCk7XG5cbiAgICAgIGRhdGEud2lkdGggPSBkYXRhLndpZHRoIHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBkYXRhLmhlaWdodCA9IGRhdGEuaGVpZ2h0IHx8IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC55IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLnk7XG4gICAgICBkYXRhLmRlcHRoID0gZGF0YS5kZXB0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueiAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi56O1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5pbXBvcnQge1ZlY3RvcjMsIFZlY3RvcjIsIEJ1ZmZlckdlb21ldHJ5fSBmcm9tICd0aHJlZSc7XG5cbmV4cG9ydCBjbGFzcyBIZWlnaHRmaWVsZE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnaGVpZ2h0ZmllbGQnLFxuICAgICAgc2l6ZTogbmV3IFZlY3RvcjIoMSwgMSksXG4gICAgICBhdXRvQWxpZ246IGZhbHNlLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IHt4OiB4ZGl2LCB5OiB5ZGl2fSA9IGRhdGEuc2l6ZTtcbiAgICAgIGNvbnN0IHZlcnRzID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkgOiBnZW9tZXRyeS52ZXJ0aWNlcztcbiAgICAgIGxldCBzaXplID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSA/IHZlcnRzLmxlbmd0aCAvIDMgOiB2ZXJ0cy5sZW5ndGg7XG5cbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBjb25zdCB4c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC54IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLng7XG4gICAgICBjb25zdCB5c2l6ZSA9IGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1heC56IC0gZ2VvbWV0cnkuYm91bmRpbmdCb3gubWluLno7XG5cbiAgICAgIGRhdGEueHB0cyA9ICh0eXBlb2YgeGRpdiA9PT0gJ3VuZGVmaW5lZCcpID8gTWF0aC5zcXJ0KHNpemUpIDogeGRpdiArIDE7XG4gICAgICBkYXRhLnlwdHMgPSAodHlwZW9mIHlkaXYgPT09ICd1bmRlZmluZWQnKSA/IE1hdGguc3FydChzaXplKSA6IHlkaXYgKyAxO1xuXG4gICAgICAvLyBub3RlIC0gdGhpcyBhc3N1bWVzIG91ciBwbGFuZSBnZW9tZXRyeSBpcyBzcXVhcmUsIHVubGVzcyB3ZSBwYXNzIGluIHNwZWNpZmljIHhkaXYgYW5kIHlkaXZcbiAgICAgIGRhdGEuYWJzTWF4SGVpZ2h0ID0gTWF0aC5tYXgoZ2VvbWV0cnkuYm91bmRpbmdCb3gubWF4LnksIE1hdGguYWJzKGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55KSk7XG5cbiAgICAgIGNvbnN0IHBvaW50cyA9IG5ldyBGbG9hdDMyQXJyYXkoc2l6ZSksXG4gICAgICAgIHhwdHMgPSBkYXRhLnhwdHMsXG4gICAgICAgIHlwdHMgPSBkYXRhLnlwdHM7XG5cbiAgICAgIHdoaWxlIChzaXplLS0pIHtcbiAgICAgICAgY29uc3Qgdk51bSA9IHNpemUgJSB4cHRzICsgKCh5cHRzIC0gTWF0aC5yb3VuZCgoc2l6ZSAvIHhwdHMpIC0gKChzaXplICUgeHB0cykgLyB4cHRzKSkgLSAxKSAqIHlwdHMpO1xuXG4gICAgICAgIGlmIChnZW9tZXRyeS5pc0J1ZmZlckdlb21ldHJ5KSBwb2ludHNbc2l6ZV0gPSB2ZXJ0c1t2TnVtICogMyArIDFdO1xuICAgICAgICBlbHNlIHBvaW50c1tzaXplXSA9IHZlcnRzW3ZOdW1dLnk7XG4gICAgICB9XG5cbiAgICAgIGRhdGEucG9pbnRzID0gcG9pbnRzO1xuXG4gICAgICBkYXRhLnNjYWxlLm11bHRpcGx5KFxuICAgICAgICBuZXcgVmVjdG9yMyh4c2l6ZSAvICh4cHRzIC0gMSksIDEsIHlzaXplIC8gKHlwdHMgLSAxKSlcbiAgICAgICk7XG5cbiAgICAgIGlmIChkYXRhLmF1dG9BbGlnbikgZ2VvbWV0cnkudHJhbnNsYXRlKHhzaXplIC8gLTIsIDAsIHlzaXplIC8gLTIpO1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQgUGh5c2ljc01vZHVsZSBmcm9tICcuL2NvcmUvUGh5c2ljc01vZHVsZSc7XG5cbmV4cG9ydCBjbGFzcyBQbGFuZU1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAncGxhbmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdCb3gpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ0JveCgpO1xuXG4gICAgICBkYXRhLndpZHRoID0gZGF0YS53aWR0aCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueCAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi54O1xuICAgICAgZGF0YS5oZWlnaHQgPSBkYXRhLmhlaWdodCB8fCBnZW9tZXRyeS5ib3VuZGluZ0JveC5tYXgueSAtIGdlb21ldHJ5LmJvdW5kaW5nQm94Lm1pbi55O1xuICAgICAgZGF0YS5ub3JtYWwgPSBkYXRhLm5vcm1hbCB8fCBnZW9tZXRyeS5mYWNlc1swXS5ub3JtYWwuY2xvbmUoKTtcbiAgICB9KTtcbiAgfVxufVxuIiwiaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU3BoZXJlTW9kdWxlIGV4dGVuZHMgUGh5c2ljc01vZHVsZSB7XG4gIGNvbnN0cnVjdG9yKHBhcmFtcykge1xuICAgIHN1cGVyKHtcbiAgICAgIHR5cGU6ICdzcGhlcmUnLFxuICAgICAgLi4uUGh5c2ljc01vZHVsZS5yaWdpZGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuYm91bmRpbmdTcGhlcmUpIGdlb21ldHJ5LmNvbXB1dGVCb3VuZGluZ1NwaGVyZSgpO1xuICAgICAgZGF0YS5yYWRpdXMgPSBkYXRhLnJhZGl1cyB8fCBnZW9tZXRyeS5ib3VuZGluZ1NwaGVyZS5yYWRpdXM7XG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5leHBvcnQgY2xhc3MgU29mdGJvZHlNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRUcmltZXNoJyxcbiAgICAgIC4uLlBoeXNpY3NNb2R1bGUuc29mdGJvZHkoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGNvbnN0IGlkeEdlb21ldHJ5ID0gZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeVxuICAgICAgICA/IGdlb21ldHJ5XG4gICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuICAgICAgICAgIGJ1ZmZlckdlb21ldHJ5LnNldEluZGV4KFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IChnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzID4gNjU1MzUgPyBVaW50MzJBcnJheSA6IFVpbnQxNkFycmF5KShnZW9tZXRyeS5mYWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgMVxuICAgICAgICAgICAgKS5jb3B5SW5kaWNlc0FycmF5KGdlb21ldHJ5LmZhY2VzKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICByZXR1cm4gYnVmZmVyR2VvbWV0cnk7XG4gICAgICAgIH0pKCk7XG5cbiAgICAgIGRhdGEuYVZlcnRpY2VzID0gaWR4R2VvbWV0cnkuYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcbiAgICAgIGRhdGEuYUluZGljZXMgPSBpZHhHZW9tZXRyeS5pbmRleC5hcnJheTtcblxuICAgICAgcmV0dXJuIG5ldyBCdWZmZXJHZW9tZXRyeSgpLmZyb21HZW9tZXRyeShnZW9tZXRyeSk7XG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRBbmNob3Iob2JqZWN0LCBub2RlLCBpbmZsdWVuY2UgPSAxLCBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzID0gdHJ1ZSkge1xuICAgIGNvbnN0IG8xID0gdGhpcy5kYXRhLmlkO1xuICAgIGNvbnN0IG8yID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZEFuY2hvcicsIHtcbiAgICAgIG9iajogbzEsXG4gICAgICBvYmoyOiBvMixcbiAgICAgIG5vZGUsXG4gICAgICBpbmZsdWVuY2UsXG4gICAgICBjb2xsaXNpb25CZXR3ZWVuTGlua2VkQm9kaWVzXG4gICAgfSk7XG4gIH1cbn1cbiIsImltcG9ydCB7QnVmZmVyR2VvbWV0cnksIEJ1ZmZlckF0dHJpYnV0ZX0gZnJvbSAndGhyZWUnO1xuaW1wb3J0IFBoeXNpY3NNb2R1bGUgZnJvbSAnLi9jb3JlL1BoeXNpY3NNb2R1bGUnO1xuXG5mdW5jdGlvbiBhcnJheU1heChhcnJheSkge1xuXHRpZiAoYXJyYXkubGVuZ3RoID09PSAwKSByZXR1cm4gLSBJbmZpbml0eTtcblxuXHR2YXIgbWF4ID0gYXJyYXlbMF07XG5cblx0Zm9yIChsZXQgaSA9IDEsIGwgPSBhcnJheS5sZW5ndGg7IGkgPCBsOyArKyBpICkge1xuXHRcdGlmIChhcnJheVsgaSBdID4gbWF4KSBtYXggPSBhcnJheVtpXTtcblx0fVxuXG5cdHJldHVybiBtYXg7XG59XG5cbmV4cG9ydCBjbGFzcyBDbG90aE1vZHVsZSBleHRlbmRzIFBoeXNpY3NNb2R1bGUge1xuICBjb25zdHJ1Y3RvcihwYXJhbXMpIHtcbiAgICBzdXBlcih7XG4gICAgICB0eXBlOiAnc29mdENsb3RoTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLmNsb3RoKClcbiAgICB9LCBwYXJhbXMpO1xuXG4gICAgdGhpcy51cGRhdGVEYXRhKChnZW9tZXRyeSwge2RhdGF9KSA9PiB7XG4gICAgICBjb25zdCBnZW9tUGFyYW1zID0gZ2VvbWV0cnkucGFyYW1ldGVycztcblxuICAgICAgY29uc3QgZ2VvbSA9IGdlb21ldHJ5LmlzQnVmZmVyR2VvbWV0cnlcbiAgICAgICAgPyBnZW9tZXRyeVxuICAgICAgICAgIDogKCgpID0+IHtcbiAgICAgICAgICBnZW9tZXRyeS5tZXJnZVZlcnRpY2VzKCk7XG5cbiAgICAgICAgICBjb25zdCBidWZmZXJHZW9tZXRyeSA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZmVyR2VvbWV0cnkuYWRkQXR0cmlidXRlKFxuICAgICAgICAgICAgJ3Bvc2l0aW9uJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5ldyBGbG9hdDMyQXJyYXkoZ2VvbWV0cnkudmVydGljZXMubGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDNcbiAgICAgICAgICAgICkuY29weVZlY3RvcjNzQXJyYXkoZ2VvbWV0cnkudmVydGljZXMpXG4gICAgICAgICAgKTtcblxuXHRcdFx0XHRcdGNvbnN0IGZhY2VzID0gZ2VvbWV0cnkuZmFjZXMsIGZhY2VzTGVuZ3RoID0gZmFjZXMubGVuZ3RoLCB1dnMgPSBnZW9tZXRyeS5mYWNlVmVydGV4VXZzWzBdO1xuXG4gICAgICAgICAgY29uc3Qgbm9ybWFsc0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDMpO1xuICAgICAgICAgIC8vIGNvbnN0IHV2c0FycmF5ID0gbmV3IEFycmF5KGdlb21ldHJ5LnZlcnRpY2VzLmxlbmd0aCAqIDIpO1xuICAgICAgICAgIGNvbnN0IHV2c0FycmF5ID0gbmV3IEZsb2F0MzJBcnJheShmYWNlc0xlbmd0aCAqIDIpO1xuICAgICAgICAgIGNvbnN0IHV2c1JlcGxhY2VkQXJyYXkgPSBuZXcgRmxvYXQzMkFycmF5KGZhY2VzTGVuZ3RoICogNik7XG5cdFx0XHRcdFx0Y29uc3QgZmFjZUFycmF5ID0gbmV3IFVpbnQzMkFycmF5KGZhY2VzTGVuZ3RoICogMyk7XG5cbiAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGZhY2VzTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGkzID0gaSAqIDM7XG4gICAgICAgICAgICBjb25zdCBpNiA9IGkgKiA2O1xuICAgICAgICAgICAgY29uc3Qgbm9ybWFsID0gZmFjZXNbaV0ubm9ybWFsIHx8IG5ldyBWZWN0b3IzKCk7XG5cblx0XHRcdFx0XHRcdGZhY2VBcnJheVtpM10gPSBmYWNlc1tpXS5hO1xuICAgICAgICAgICAgZmFjZUFycmF5W2kzICsgMV0gPSBmYWNlc1tpXS5iO1xuICAgICAgICAgICAgZmFjZUFycmF5W2kzICsgMl0gPSBmYWNlc1tpXS5jO1xuXG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTNdID0gbm9ybWFsLng7XG4gICAgICAgICAgICBub3JtYWxzQXJyYXlbaTMgKyAxXSA9IG5vcm1hbC55O1xuICAgICAgICAgICAgbm9ybWFsc0FycmF5W2kzICsgMl0gPSBub3JtYWwuejtcblxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYSAqIDIgKyAwXSA9IHV2c1tpXVswXS54OyAvLyBhXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5hICogMiArIDFdID0gdXZzW2ldWzBdLnk7XG5cbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmIgKiAyICsgMF0gPSB1dnNbaV1bMV0ueDsgLy8gYlxuICAgICAgICAgICAgdXZzQXJyYXlbZmFjZXNbaV0uYiAqIDIgKyAxXSA9IHV2c1tpXVsxXS55O1xuXG4gICAgICAgICAgICB1dnNBcnJheVtmYWNlc1tpXS5jICogMiArIDBdID0gdXZzW2ldWzJdLng7IC8vIGNcbiAgICAgICAgICAgIHV2c0FycmF5W2ZhY2VzW2ldLmMgKiAyICsgMV0gPSB1dnNbaV1bMl0ueTtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAnbm9ybWFsJyxcbiAgICAgICAgICAgIG5ldyBCdWZmZXJBdHRyaWJ1dGUoXG4gICAgICAgICAgICAgIG5vcm1hbHNBcnJheSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKVxuICAgICAgICAgICk7XG5cbiAgICAgICAgICBidWZmZXJHZW9tZXRyeS5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAndXYnLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgdXZzQXJyYXksXG4gICAgICAgICAgICAgIDJcbiAgICAgICAgICAgIClcbiAgICAgICAgICApO1xuXG5cdFx0XHRcdFx0YnVmZmVyR2VvbWV0cnkuc2V0SW5kZXgoXG4gICAgICAgICAgICBuZXcgQnVmZmVyQXR0cmlidXRlKFxuICAgICAgICAgICAgICBuZXcgKGFycmF5TWF4KGZhY2VzKSAqIDMgPiA2NTUzNSA/IFVpbnQzMkFycmF5IDogVWludDE2QXJyYXkpKGZhY2VzTGVuZ3RoICogMyksXG4gICAgICAgICAgICAgIDFcbiAgICAgICAgICAgICkuY29weUluZGljZXNBcnJheShmYWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmZlckdlb21ldHJ5O1xuICAgICAgICB9KSgpO1xuXG4gICAgICBjb25zdCB2ZXJ0cyA9IGdlb20uYXR0cmlidXRlcy5wb3NpdGlvbi5hcnJheTtcblxuICAgICAgaWYgKCFnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMpIGdlb21QYXJhbXMud2lkdGhTZWdtZW50cyA9IDE7XG4gICAgICBpZiAoIWdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMpIGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgPSAxO1xuXG4gICAgICBjb25zdCBpZHgwMCA9IDA7XG4gICAgICBjb25zdCBpZHgwMSA9IGdlb21QYXJhbXMud2lkdGhTZWdtZW50cztcbiAgICAgIGNvbnN0IGlkeDEwID0gKGdlb21QYXJhbXMuaGVpZ2h0U2VnbWVudHMgKyAxKSAqIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKSAtIChnZW9tUGFyYW1zLndpZHRoU2VnbWVudHMgKyAxKTtcbiAgICAgIGNvbnN0IGlkeDExID0gdmVydHMubGVuZ3RoIC8gMyAtIDE7XG5cbiAgICAgIGRhdGEuY29ybmVycyA9IFtcbiAgICAgICAgdmVydHNbaWR4MDEgKiAzXSwgdmVydHNbaWR4MDEgKiAzICsgMV0sIHZlcnRzW2lkeDAxICogMyArIDJdLCAvLyAgIOKVl1xuICAgICAgICB2ZXJ0c1tpZHgwMCAqIDNdLCB2ZXJ0c1tpZHgwMCAqIDMgKyAxXSwgdmVydHNbaWR4MDAgKiAzICsgMl0sIC8vIOKVlFxuICAgICAgICB2ZXJ0c1tpZHgxMSAqIDNdLCB2ZXJ0c1tpZHgxMSAqIDMgKyAxXSwgdmVydHNbaWR4MTEgKiAzICsgMl0sIC8vICAgICAgIOKVnVxuICAgICAgICB2ZXJ0c1tpZHgxMCAqIDNdLCB2ZXJ0c1tpZHgxMCAqIDMgKyAxXSwgdmVydHNbaWR4MTAgKiAzICsgMl0sIC8vICAgICDilZpcbiAgICAgIF07XG5cbiAgICAgIGRhdGEuc2VnbWVudHMgPSBbZ2VvbVBhcmFtcy53aWR0aFNlZ21lbnRzICsgMSwgZ2VvbVBhcmFtcy5oZWlnaHRTZWdtZW50cyArIDFdO1xuXG4gICAgICByZXR1cm4gZ2VvbTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG5cblx0bGlua05vZGVzKG9iamVjdCwgbjEsIG4yLCBtb2RpZmllcikge1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzLmRhdGEuaWQ7XG4gICAgY29uc3QgYm9keSA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdsaW5rTm9kZXMnLCB7XG4gICAgICBzZWxmLFxuXHRcdFx0Ym9keSxcbiAgICAgIG4xLCAvLyBzZWxmIG5vZGVcbiAgICAgIG4yLCAvLyBib2R5IG5vZGVcblx0XHRcdG1vZGlmaWVyXG4gICAgfSk7XG4gIH1cblxuICBhcHBlbmRMaW5lYXJKb2ludChvYmplY3QsIHNwZWNzKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBib2R5ID0gb2JqZWN0LnVzZSgncGh5c2ljcycpLmRhdGEuaWQ7XG5cbiAgICB0aGlzLmV4ZWN1dGUoJ2FwcGVuZExpbmVhckpvaW50Jywge1xuICAgICAgc2VsZixcbiAgICAgIGJvZHksXG4gICAgICBzcGVjc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0J1ZmZlckdlb21ldHJ5LCBCdWZmZXJBdHRyaWJ1dGUsIFZlY3RvcjN9IGZyb20gJ3RocmVlJztcbmltcG9ydCBQaHlzaWNzTW9kdWxlIGZyb20gJy4vY29yZS9QaHlzaWNzTW9kdWxlJztcblxuZXhwb3J0IGNsYXNzIFJvcGVNb2R1bGUgZXh0ZW5kcyBQaHlzaWNzTW9kdWxlIHtcbiAgY29uc3RydWN0b3IocGFyYW1zKSB7XG4gICAgc3VwZXIoe1xuICAgICAgdHlwZTogJ3NvZnRSb3BlTWVzaCcsXG4gICAgICAuLi5QaHlzaWNzTW9kdWxlLnJvcGUoKVxuICAgIH0sIHBhcmFtcyk7XG5cbiAgICB0aGlzLnVwZGF0ZURhdGEoKGdlb21ldHJ5LCB7ZGF0YX0pID0+IHtcbiAgICAgIGlmICghZ2VvbWV0cnkuaXNCdWZmZXJHZW9tZXRyeSkge1xuICAgICAgICBnZW9tZXRyeSA9ICgoKSA9PiB7XG4gICAgICAgICAgY29uc3QgYnVmZiA9IG5ldyBCdWZmZXJHZW9tZXRyeSgpO1xuXG4gICAgICAgICAgYnVmZi5hZGRBdHRyaWJ1dGUoXG4gICAgICAgICAgICAncG9zaXRpb24nLFxuICAgICAgICAgICAgbmV3IEJ1ZmZlckF0dHJpYnV0ZShcbiAgICAgICAgICAgICAgbmV3IEZsb2F0MzJBcnJheShnZW9tZXRyeS52ZXJ0aWNlcy5sZW5ndGggKiAzKSxcbiAgICAgICAgICAgICAgM1xuICAgICAgICAgICAgKS5jb3B5VmVjdG9yM3NBcnJheShnZW9tZXRyeS52ZXJ0aWNlcylcbiAgICAgICAgICApO1xuXG4gICAgICAgICAgcmV0dXJuIGJ1ZmY7XG4gICAgICAgIH0pKCk7XG4gICAgICB9XG5cbiAgICAgIGNvbnN0IGxlbmd0aCA9IGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXkubGVuZ3RoIC8gMztcbiAgICAgIGNvbnN0IHZlcnQgPSBuID0+IG5ldyBWZWN0b3IzKCkuZnJvbUFycmF5KGdlb21ldHJ5LmF0dHJpYnV0ZXMucG9zaXRpb24uYXJyYXksIG4qMyk7XG5cbiAgICAgIGNvbnN0IHYxID0gdmVydCgwKTtcbiAgICAgIGNvbnN0IHYyID0gdmVydChsZW5ndGggLSAxKTtcblxuICAgICAgZGF0YS5kYXRhID0gW1xuICAgICAgICB2MS54LCB2MS55LCB2MS56LFxuICAgICAgICB2Mi54LCB2Mi55LCB2Mi56LFxuICAgICAgICBsZW5ndGhcbiAgICAgIF07XG5cbiAgICAgIHJldHVybiBnZW9tZXRyeTtcbiAgICB9KTtcbiAgfVxuXG4gIGFwcGVuZEFuY2hvcihvYmplY3QsIG5vZGUsIGluZmx1ZW5jZSwgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllcyA9IHRydWUpIHtcbiAgICBjb25zdCBvMSA9IHRoaXMuZGF0YS5pZDtcbiAgICBjb25zdCBvMiA9IG9iamVjdC51c2UoJ3BoeXNpY3MnKS5kYXRhLmlkO1xuXG4gICAgdGhpcy5leGVjdXRlKCdhcHBlbmRBbmNob3InLCB7XG4gICAgICBvYmo6IG8xLFxuICAgICAgb2JqMjogbzIsXG4gICAgICBub2RlLFxuICAgICAgaW5mbHVlbmNlLFxuICAgICAgY29sbGlzaW9uQmV0d2VlbkxpbmtlZEJvZGllc1xuICAgIH0pO1xuICB9XG59XG4iLCJpbXBvcnQge0xvb3B9IGZyb20gJ3docyc7XG5cbmltcG9ydCB7XG4gIE9iamVjdDNELFxuICBRdWF0ZXJuaW9uLFxuICBWZWN0b3IzLFxuICBFdWxlclxufSBmcm9tICd0aHJlZSc7XG5cbmNvbnN0IFBJXzIgPSBNYXRoLlBJIC8gMjtcblxuLy8gVE9ETzogRml4IERPTVxuZnVuY3Rpb24gRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihjYW1lcmEsIG1lc2gsIHBhcmFtcykge1xuICBjb25zdCB2ZWxvY2l0eUZhY3RvciA9IDE7XG4gIGxldCBydW5WZWxvY2l0eSA9IDAuMjU7XG5cbiAgbWVzaC51c2UoJ3BoeXNpY3MnKS5zZXRBbmd1bGFyRmFjdG9yKHt4OiAwLCB5OiAwLCB6OiAwfSk7XG4gIGNhbWVyYS5wb3NpdGlvbi5zZXQoMCwgMCwgMCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBjb25zb2xlLmxvZyhjb250YWN0Tm9ybWFsLnkpO1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIC8vIFVzZSBhIFwiZ29vZFwiIHRocmVzaG9sZCB2YWx1ZSBiZXR3ZWVuIDAgYW5kIDEgaGVyZSFcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICB9KTtcblxuICBjb25zdCBvbk1vdXNlTW92ZSA9IGV2ZW50ID0+IHtcbiAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuXG4gICAgY29uc3QgbW92ZW1lbnRYID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WCA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFggOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRYID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFgoKSA6IDA7XG4gICAgY29uc3QgbW92ZW1lbnRZID0gdHlwZW9mIGV2ZW50Lm1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgID8gZXZlbnQubW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50Lm1vek1vdmVtZW50WSA9PT0gJ251bWJlcidcbiAgICAgICAgPyBldmVudC5tb3pNb3ZlbWVudFkgOiB0eXBlb2YgZXZlbnQuZ2V0TW92ZW1lbnRZID09PSAnZnVuY3Rpb24nXG4gICAgICAgICAgPyBldmVudC5nZXRNb3ZlbWVudFkoKSA6IDA7XG5cbiAgICB5YXdPYmplY3Qucm90YXRpb24ueSAtPSBtb3ZlbWVudFggKiAwLjAwMjtcbiAgICBwaXRjaE9iamVjdC5yb3RhdGlvbi54IC09IG1vdmVtZW50WSAqIDAuMDAyO1xuXG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3QgcGh5c2ljcyA9IHBsYXllci51c2UoJ3BoeXNpY3MnKTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBjb25zb2xlLmxvZyhjYW5KdW1wKTtcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgY29uc3Qgc3BlZWQgPSB2ZWxvY2l0eUZhY3RvciAqIGRlbHRhICogcGFyYW1zLnNwZWVkICogcnVuVmVsb2NpdHk7XG5cbiAgICBpZiAobW92ZUZvcndhcmQpIGlucHV0VmVsb2NpdHkueiA9IC1zcGVlZDtcbiAgICBpZiAobW92ZUJhY2t3YXJkKSBpbnB1dFZlbG9jaXR5LnogPSBzcGVlZDtcbiAgICBpZiAobW92ZUxlZnQpIGlucHV0VmVsb2NpdHkueCA9IC1zcGVlZDtcbiAgICBpZiAobW92ZVJpZ2h0KSBpbnB1dFZlbG9jaXR5LnggPSBzcGVlZDtcblxuICAgIC8vIENvbnZlcnQgdmVsb2NpdHkgdG8gd29ybGQgY29vcmRpbmF0ZXNcbiAgICBldWxlci54ID0gcGl0Y2hPYmplY3Qucm90YXRpb24ueDtcbiAgICBldWxlci55ID0geWF3T2JqZWN0LnJvdGF0aW9uLnk7XG4gICAgZXVsZXIub3JkZXIgPSAnWFlaJztcblxuICAgIHF1YXQuc2V0RnJvbUV1bGVyKGV1bGVyKTtcblxuICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHF1YXQpO1xuXG4gICAgcGh5c2ljcy5hcHBseUNlbnRyYWxJbXB1bHNlKHt4OiBpbnB1dFZlbG9jaXR5LngsIHk6IDAsIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIHBoeXNpY3Muc2V0QW5ndWxhclZlbG9jaXR5KHt4OiBpbnB1dFZlbG9jaXR5LnosIHk6IDAsIHo6IC1pbnB1dFZlbG9jaXR5Lnh9KTtcbiAgICBwaHlzaWNzLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLm1hbmFnZXIuZ2V0KCdtb2R1bGU6d29ybGQnKS5hZGRFdmVudExpc3RlbmVyKCd1cGRhdGUnLCAoKSA9PiB7XG4gICAgICBpZiAodGhpcy5lbmFibGVkID09PSBmYWxzZSkgcmV0dXJuO1xuICAgICAgeWF3T2JqZWN0LnBvc2l0aW9uLmNvcHkocGxheWVyLnBvc2l0aW9uKTtcbiAgICB9KTtcbiAgfSk7XG59XG5cbmV4cG9ydCBjbGFzcyBGaXJzdFBlcnNvbk1vZHVsZSB7XG4gIHN0YXRpYyBkZWZhdWx0cyA9IHtcbiAgICBibG9jazogbnVsbCxcbiAgICBzcGVlZDogMSxcbiAgICB5cG9zOiAxXG4gIH07XG5cbiAgY29uc3RydWN0b3Iob2JqZWN0LCBwYXJhbXMgPSB7fSkge1xuICAgIHRoaXMub2JqZWN0ID0gb2JqZWN0O1xuICAgIHRoaXMucGFyYW1zID0gcGFyYW1zO1xuXG4gICAgaWYgKCF0aGlzLnBhcmFtcy5ibG9jaykge1xuICAgICAgdGhpcy5wYXJhbXMuYmxvY2sgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZCgnYmxvY2tlcicpO1xuICAgIH1cbiAgfVxuXG4gIG1hbmFnZXIobWFuYWdlcikge1xuICAgIHRoaXMuY29udHJvbHMgPSBuZXcgRmlyc3RQZXJzb25Db250cm9sc1NvbHZlcihtYW5hZ2VyLmdldCgnY2FtZXJhJyksIHRoaXMub2JqZWN0LCB0aGlzLnBhcmFtcyk7XG5cbiAgICBpZiAoJ3BvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICdtb3pQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50XG4gICAgICB8fCAnd2Via2l0UG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudCkge1xuICAgICAgY29uc3QgZWxlbWVudCA9IGRvY3VtZW50LmJvZHk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICBpZiAoZG9jdW1lbnQucG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQubW96UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgfHwgZG9jdW1lbnQud2Via2l0UG9pbnRlckxvY2tFbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gdHJ1ZTtcbiAgICAgICAgICB0aGlzLnBhcmFtcy5ibG9jay5zdHlsZS5kaXNwbGF5ID0gJ25vbmUnO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMuY29udHJvbHMuZW5hYmxlZCA9IGZhbHNlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnYmxvY2snO1xuICAgICAgICB9XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2NoYW5nZScsIHBvaW50ZXJsb2NrY2hhbmdlLCBmYWxzZSk7XG5cbiAgICAgIGNvbnN0IHBvaW50ZXJsb2NrZXJyb3IgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvbnNvbGUud2FybignUG9pbnRlciBsb2NrIGVycm9yLicpO1xuICAgICAgfTtcblxuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcigncG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCd3ZWJraXRwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuXG4gICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdib2R5JykuYWRkRXZlbnRMaXN0ZW5lcignY2xpY2snLCAoKSA9PiB7XG4gICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrID0gZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2tcbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdFBvaW50ZXJMb2NrO1xuXG4gICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4gPSBlbGVtZW50LnJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbHNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdEZ1bGxTY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50LndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuO1xuXG4gICAgICAgIGlmICgvRmlyZWZveC9pLnRlc3QobmF2aWdhdG9yLnVzZXJBZ2VudCkpIHtcbiAgICAgICAgICBjb25zdCBmdWxsc2NyZWVuY2hhbmdlID0gKCkgPT4ge1xuICAgICAgICAgICAgaWYgKGRvY3VtZW50LmZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxzY3JlZW5FbGVtZW50ID09PSBlbGVtZW50XG4gICAgICAgICAgICAgIHx8IGRvY3VtZW50Lm1vekZ1bGxTY3JlZW5FbGVtZW50ID09PSBlbGVtZW50KSB7XG4gICAgICAgICAgICAgIGRvY3VtZW50LnJlbW92ZUV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlKTtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuXG4gICAgICAgICAgICAgIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfTtcblxuICAgICAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ2Z1bGxzY3JlZW5jaGFuZ2UnLCBmdWxsc2NyZWVuY2hhbmdlLCBmYWxzZSk7XG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96ZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgICAgIGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW4oKTtcbiAgICAgICAgfSBlbHNlIGVsZW1lbnQucmVxdWVzdFBvaW50ZXJMb2NrKCk7XG4gICAgICB9KTtcbiAgICB9IGVsc2UgY29uc29sZS53YXJuKCdZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgUG9pbnRlckxvY2snKTtcblxuICAgIG1hbmFnZXIuZ2V0KCdzY2VuZScpLmFkZCh0aGlzLmNvbnRyb2xzLmdldE9iamVjdCgpKTtcbiAgfVxuXG4gIGludGVncmF0ZShzZWxmKSB7XG4gICAgY29uc3QgdXBkYXRlUHJvY2Vzc29yID0gYyA9PiB7XG4gICAgICBzZWxmLmNvbnRyb2xzLnVwZGF0ZShjLmdldERlbHRhKCkpO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZUxvb3AgPSBuZXcgTG9vcCh1cGRhdGVQcm9jZXNzb3IpLnN0YXJ0KHRoaXMpO1xuICB9XG59XG4iLCJpbXBvcnQgeyBMb29wIH0gZnJvbSAnd2hzJztcblxuaW1wb3J0IHtcbiAgT2JqZWN0M0QsXG4gIFF1YXRlcm5pb24sXG4gIFZlY3RvcjMsXG4gIEV1bGVyXG59IGZyb20gJ3RocmVlJztcblxuY29uc3QgUElfMiA9IE1hdGguUEkgLyAyO1xubGV0IGRpcmVjdGlvbiA9IG5ldyBUSFJFRS5WZWN0b3IzKCk7XG5sZXQgaW1wdWxzZV9sZW5ndGggPSAxO1xuXG5mdW5jdGlvbiBzaWduKHgpIHtcbiAgcmV0dXJuIHR5cGVvZiB4ID09PSAnbnVtYmVyJyA/IHggPyB4IDwgMCA/IC0xIDogMSA6IHggPT09IHggPyAwIDogTmFOIDogTmFOO1xufVxuXG5mdW5jdGlvbiByYW5nZV9zY2FsZShpbnB1dCwgaW5pdF9sb3csIGluaXRfaGlnaCwgZmluYWxfbG93LCBmaW5hbF9oaWdoKSB7XG4gIHJldHVybiAoaW5wdXQgLSBpbml0X2xvdykgKiAoZmluYWxfaGlnaCAtIGZpbmFsX2xvdykgLyAoaW5pdF9oaWdoIC0gaW5pdF9sb3cpICsgZmluYWxfbG93O1xufVxuXG4vLyBUT0RPOiBGaXggRE9NXG5mdW5jdGlvbiBUaGlyZFBlcnNvbkNvbnRyb2xzU29sdmVyKGNhbWVyYSwgbWVzaCwgcGFyYW1zKSB7XG4gIGNvbnN0IHZlbG9jaXR5RmFjdG9yID0gMTtcbiAgbGV0IHJ1blZlbG9jaXR5ID0gMC4yNTtcblxuICBtZXNoLnVzZSgncGh5c2ljcycpLnNldEFuZ3VsYXJGYWN0b3Ioe3g6IDAsIHk6IDAsIHo6IDB9KTtcbiAgY2FtZXJhLnBvc2l0aW9uLnNldCgwLCAwLCAxNSk7XG4gIC8vY2FtZXJhLm5hdGl2ZS5sb29rQXQobWVzaCk7XG5cbiAgLyogSW5pdCAqL1xuICBjb25zdCBwbGF5ZXIgPSBtZXNoLFxuICAgIHBpdGNoT2JqZWN0ID0gbmV3IE9iamVjdDNEKCk7XG5cbiAgcGl0Y2hPYmplY3QuYWRkKGNhbWVyYS5uYXRpdmUpO1xuXG4gIGNvbnN0IHlhd09iamVjdCA9IG5ldyBPYmplY3QzRCgpO1xuXG4gIHlhd09iamVjdC5wb3NpdGlvbi55ID0gcGFyYW1zLnlwb3M7IC8vIGV5ZXMgYXJlIDIgbWV0ZXJzIGFib3ZlIHRoZSBncm91bmRcbiAgeWF3T2JqZWN0LmFkZChwaXRjaE9iamVjdCk7XG5cbiAgY29uc3QgcXVhdCA9IG5ldyBRdWF0ZXJuaW9uKCk7XG5cbiAgbGV0IGNhbkp1bXAgPSBmYWxzZSxcbiAgICAvLyBNb3Zlcy5cbiAgICBtb3ZlRm9yd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlLFxuICAgIG1vdmVMZWZ0ID0gZmFsc2UsXG4gICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG5cbiAgcGxheWVyLm9uKCdjb2xsaXNpb24nLCAob3RoZXJPYmplY3QsIHYsIHIsIGNvbnRhY3ROb3JtYWwpID0+IHtcbiAgICBjb25zb2xlLmxvZyhjb250YWN0Tm9ybWFsLnkpO1xuICAgIGlmIChjb250YWN0Tm9ybWFsLnkgPCAwLjUpIHtcbiAgICAgIGNhbkp1bXAgPSB0cnVlO1xuICAgIH1cbiAgfSk7XG5cbiAgY29uc3Qgb25Nb3VzZU1vdmUgPSBldmVudCA9PiB7XG4gICAgaWYgKHRoaXMuZW5hYmxlZCA9PT0gZmFsc2UpIHJldHVybjtcblxuICAgIGNvbnN0IG1vdmVtZW50WCA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WCA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFggPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRYIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WCA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRYKCkgOiAwO1xuICAgIGNvbnN0IG1vdmVtZW50WSA9IHR5cGVvZiBldmVudC5tb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICA/IGV2ZW50Lm1vdmVtZW50WSA6IHR5cGVvZiBldmVudC5tb3pNb3ZlbWVudFkgPT09ICdudW1iZXInXG4gICAgICAgID8gZXZlbnQubW96TW92ZW1lbnRZIDogdHlwZW9mIGV2ZW50LmdldE1vdmVtZW50WSA9PT0gJ2Z1bmN0aW9uJ1xuICAgICAgICAgID8gZXZlbnQuZ2V0TW92ZW1lbnRZKCkgOiAwO1xuXG4gICAgeWF3T2JqZWN0LnJvdGF0aW9uLnkgLT0gbW92ZW1lbnRYICogMC4wMDI7XG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCAtPSBtb3ZlbWVudFkgKiAwLjAwMjtcbiAgICBcbiAgICAvL3lhd09iamVjdC5yb3RhdGlvbi55ID0gTWF0aC5tYXgoLU1hdGguUEksIE1hdGgubWluKE1hdGguUEksIHlhd09iamVjdC5yb3RhdGlvbi55KSk7XG4gICAgcGl0Y2hPYmplY3Qucm90YXRpb24ueCA9IE1hdGgubWF4KC1QSV8yLCBNYXRoLm1pbihQSV8yLCBwaXRjaE9iamVjdC5yb3RhdGlvbi54KSk7XG4gIH07XG5cbiAgY29uc3QgcGh5c2ljcyA9IHBsYXllci51c2UoJ3BoeXNpY3MnKTtcblxuICBjb25zdCBvbktleURvd24gPSBldmVudCA9PiB7XG4gICAgc3dpdGNoIChldmVudC5rZXlDb2RlKSB7XG4gICAgICBjYXNlIDM4OiAvLyB1cFxuICAgICAgY2FzZSA4NzogLy8gd1xuICAgICAgICBtb3ZlRm9yd2FyZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgNDA6IC8vIGRvd25cbiAgICAgIGNhc2UgODM6IC8vIHNcbiAgICAgICAgbW92ZUJhY2t3YXJkID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMzk6IC8vIHJpZ2h0XG4gICAgICBjYXNlIDY4OiAvLyBkXG4gICAgICAgIG1vdmVSaWdodCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDMyOiAvLyBzcGFjZVxuICAgICAgICBjb25zb2xlLmxvZyhjYW5KdW1wKTtcbiAgICAgICAgaWYgKGNhbkp1bXAgPT09IHRydWUpIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogMCwgeTogMzAwLCB6OiAwfSk7XG4gICAgICAgIGNhbkp1bXAgPSBmYWxzZTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgMTY6IC8vIHNoaWZ0XG4gICAgICAgIHJ1blZlbG9jaXR5ID0gMC41O1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICB9XG4gIH07XG5cbiAgY29uc3Qgb25LZXlVcCA9IGV2ZW50ID0+IHtcbiAgICBzd2l0Y2ggKGV2ZW50LmtleUNvZGUpIHtcbiAgICAgIGNhc2UgMzg6IC8vIHVwXG4gICAgICBjYXNlIDg3OiAvLyB3XG4gICAgICAgIG1vdmVGb3J3YXJkID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDM3OiAvLyBsZWZ0XG4gICAgICBjYXNlIDY1OiAvLyBhXG4gICAgICAgIG1vdmVMZWZ0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDQwOiAvLyBkb3duXG4gICAgICBjYXNlIDgzOiAvLyBhXG4gICAgICAgIG1vdmVCYWNrd2FyZCA9IGZhbHNlO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSAzOTogLy8gcmlnaHRcbiAgICAgIGNhc2UgNjg6IC8vIGRcbiAgICAgICAgbW92ZVJpZ2h0ID0gZmFsc2U7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIDE2OiAvLyBzaGlmdFxuICAgICAgICBydW5WZWxvY2l0eSA9IDAuMjU7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgIH1cbiAgfTtcblxuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ21vdXNlbW92ZScsIG9uTW91c2VNb3ZlLCBmYWxzZSk7XG4gIGRvY3VtZW50LmJvZHkuYWRkRXZlbnRMaXN0ZW5lcigna2V5ZG93bicsIG9uS2V5RG93biwgZmFsc2UpO1xuICBkb2N1bWVudC5ib2R5LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgb25LZXlVcCwgZmFsc2UpO1xuXG4gIHRoaXMuZW5hYmxlZCA9IGZhbHNlO1xuICB0aGlzLmdldE9iamVjdCA9ICgpID0+IHlhd09iamVjdDtcblxuICB0aGlzLmdldERpcmVjdGlvbiA9IHRhcmdldFZlYyA9PiB7XG4gICAgdGFyZ2V0VmVjLnNldCgwLCAwLCAtMSk7XG4gICAgcXVhdC5tdWx0aXBseVZlY3RvcjModGFyZ2V0VmVjKTtcbiAgfTtcblxuICAvLyBNb3ZlcyB0aGUgY2FtZXJhIHRvIHRoZSBQaHlzaS5qcyBvYmplY3QgcG9zaXRpb25cbiAgLy8gYW5kIGFkZHMgdmVsb2NpdHkgdG8gdGhlIG9iamVjdCBpZiB0aGUgcnVuIGtleSBpcyBkb3duLlxuICBjb25zdCBpbnB1dFZlbG9jaXR5ID0gbmV3IFZlY3RvcjMoKSxcbiAgICBldWxlciA9IG5ldyBFdWxlcigpO1xuXG4gIHRoaXMudXBkYXRlID0gZGVsdGEgPT4ge1xuICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG5cbiAgICBkZWx0YSA9IGRlbHRhIHx8IDAuNTtcbiAgICBkZWx0YSA9IE1hdGgubWluKGRlbHRhLCAwLjUsIGRlbHRhKTtcblxuICAgIGlucHV0VmVsb2NpdHkuc2V0KDAsIDAsIDApO1xuXG4gICAgZGlyZWN0aW9uID0gY2FtZXJhLm5hdGl2ZS5nZXRXb3JsZERpcmVjdGlvbiggZGlyZWN0aW9uICk7XG4gICAgbGV0IGFuZ2xlID0gVEhSRUUuTWF0aC5yYWRUb0RlZyggTWF0aC5hdGFuKGRpcmVjdGlvbi55KSApXG4gICAgYW5nbGUgPSByYW5nZV9zY2FsZShhbmdsZSwgLTQ1LCA0NSwgLTkwLCA5MClcbiAgICBsZXQgcmFkaWFucyA9IFRIUkVFLk1hdGguZGVnVG9SYWQoYW5nbGUpXG5cbiAgICBjb25zdCBzcGVlZCA9IHZlbG9jaXR5RmFjdG9yICogZGVsdGEgKiBwYXJhbXMuc3BlZWQgKiBydW5WZWxvY2l0eTtcbiAgICBkaXJlY3Rpb24ubm9ybWFsaXplKClcblxuICAgIGlmICggbW92ZUZvcndhcmQgfHwgbW92ZUJhY2t3YXJkICkge1xuICAgICAgbGV0IGR0ID0gbW92ZUZvcndhcmQgPyAtMSA6IDFcbiAgICAgIGlucHV0VmVsb2NpdHkueSA9IC1kdCAqIHNwZWVkICogTWF0aC5zaW4ocmFkaWFucykgKiBpbXB1bHNlX2xlbmd0aDtcbiAgICAgIGlucHV0VmVsb2NpdHkueiA9IGR0ICogc3BlZWQgKiBNYXRoLmNvcyhyYWRpYW5zKSAqIGltcHVsc2VfbGVuZ3RoO1xuICAgIH1cblxuICAgIGlmIChtb3ZlTGVmdCB8fCBtb3ZlUmlnaHQpIHtcbiAgICAgIGxldCBkdCA9IG1vdmVMZWZ0ID8gLTEgOiAxXG4gICAgICBpbnB1dFZlbG9jaXR5LnggPSBkdCAqIHNwZWVkICogaW1wdWxzZV9sZW5ndGg7XG4gICAgfVxuXG4gICAgXG4gICAgaWYoaW5wdXRWZWxvY2l0eS54IHx8IGlucHV0VmVsb2NpdHkueSB8fCBpbnB1dFZlbG9jaXR5LnopIHtcbiAgICAgIGlucHV0VmVsb2NpdHkuYXBwbHlRdWF0ZXJuaW9uKHlhd09iamVjdC5xdWF0ZXJuaW9uKTtcbiAgICAgIHBoeXNpY3MuYXBwbHlDZW50cmFsSW1wdWxzZSh7eDogaW5wdXRWZWxvY2l0eS54LCB5OiBpbnB1dFZlbG9jaXR5LnksIHo6IGlucHV0VmVsb2NpdHkuen0pO1xuICAgIH1cbiAgfTtcblxuICBwbGF5ZXIub24oJ3BoeXNpY3M6YWRkZWQnLCAoKSA9PiB7XG4gICAgcGxheWVyLnVzZShcInBoeXNpY3NcIikuc2V0RGFtcGluZyguNiwgMClcbiAgICBwbGF5ZXIubWFuYWdlci5nZXQoJ21vZHVsZTp3b3JsZCcpLmFkZEV2ZW50TGlzdGVuZXIoJ3VwZGF0ZScsICgpID0+IHtcbiAgICAgIGlmICh0aGlzLmVuYWJsZWQgPT09IGZhbHNlKSByZXR1cm47XG4gICAgICB5YXdPYmplY3QucG9zaXRpb24uY29weShwbGF5ZXIucG9zaXRpb24pO1xuICAgIH0pO1xuICB9KTtcbn1cblxuZXhwb3J0IGNsYXNzIFRoaXJkUGVyc29uTW9kdWxlIHtcbiAgc3RhdGljIGRlZmF1bHRzID0ge1xuICAgIGJsb2NrOiBudWxsLFxuICAgIHNwZWVkOiAxLFxuICAgIHlwb3M6IDFcbiAgfTtcblxuICBjb25zdHJ1Y3RvcihvYmplY3QsIHBhcmFtcyA9IHt9KSB7XG4gICAgdGhpcy5vYmplY3QgPSBvYmplY3Q7XG4gICAgdGhpcy5wYXJhbXMgPSBwYXJhbXM7XG5cbiAgICBpZiAoIXRoaXMucGFyYW1zLmJsb2NrKSB7XG4gICAgICB0aGlzLnBhcmFtcy5ibG9jayA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdibG9ja2VyJyk7XG4gICAgfVxuICB9XG5cbiAgbWFuYWdlcihtYW5hZ2VyKSB7XG4gICAgdGhpcy5jb250cm9scyA9IG5ldyBUaGlyZFBlcnNvbkNvbnRyb2xzU29sdmVyKG1hbmFnZXIuZ2V0KCdjYW1lcmEnKSwgdGhpcy5vYmplY3QsIHRoaXMucGFyYW1zKTtcblxuICAgIGlmICgncG9pbnRlckxvY2tFbGVtZW50JyBpbiBkb2N1bWVudFxuICAgICAgfHwgJ21velBvaW50ZXJMb2NrRWxlbWVudCcgaW4gZG9jdW1lbnRcbiAgICAgIHx8ICd3ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQnIGluIGRvY3VtZW50KSB7XG4gICAgICBjb25zdCBlbGVtZW50ID0gZG9jdW1lbnQuYm9keTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tjaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgIGlmIChkb2N1bWVudC5wb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC5tb3pQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICB8fCBkb2N1bWVudC53ZWJraXRQb2ludGVyTG9ja0VsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICB0aGlzLmNvbnRyb2xzLmVuYWJsZWQgPSB0cnVlO1xuICAgICAgICAgIHRoaXMucGFyYW1zLmJsb2NrLnN0eWxlLmRpc3BsYXkgPSAnbm9uZSc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy5jb250cm9scy5lbmFibGVkID0gZmFsc2U7XG4gICAgICAgICAgdGhpcy5wYXJhbXMuYmxvY2suc3R5bGUuZGlzcGxheSA9ICdibG9jayc7XG4gICAgICAgIH1cbiAgICAgIH07XG5cbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3BvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ21venBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrY2hhbmdlJywgcG9pbnRlcmxvY2tjaGFuZ2UsIGZhbHNlKTtcblxuICAgICAgY29uc3QgcG9pbnRlcmxvY2tlcnJvciA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29uc29sZS53YXJuKCdQb2ludGVyIGxvY2sgZXJyb3IuJyk7XG4gICAgICB9O1xuXG4gICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdwb2ludGVybG9ja2Vycm9yJywgcG9pbnRlcmxvY2tlcnJvciwgZmFsc2UpO1xuICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignbW96cG9pbnRlcmxvY2tlcnJvcicsIHBvaW50ZXJsb2NrZXJyb3IsIGZhbHNlKTtcbiAgICAgIGRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoJ3dlYmtpdHBvaW50ZXJsb2NrZXJyb3InLCBwb2ludGVybG9ja2Vycm9yLCBmYWxzZSk7XG5cbiAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ2JvZHknKS5hZGRFdmVudExpc3RlbmVyKCdjbGljaycsICgpID0+IHtcbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2sgPSBlbGVtZW50LnJlcXVlc3RQb2ludGVyTG9ja1xuICAgICAgICAgIHx8IGVsZW1lbnQubW96UmVxdWVzdFBvaW50ZXJMb2NrXG4gICAgICAgICAgfHwgZWxlbWVudC53ZWJraXRSZXF1ZXN0UG9pbnRlckxvY2s7XG5cbiAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbiA9IGVsZW1lbnQucmVxdWVzdEZ1bGxzY3JlZW5cbiAgICAgICAgICB8fCBlbGVtZW50Lm1velJlcXVlc3RGdWxsc2NyZWVuXG4gICAgICAgICAgfHwgZWxlbWVudC5tb3pSZXF1ZXN0RnVsbFNjcmVlblxuICAgICAgICAgIHx8IGVsZW1lbnQud2Via2l0UmVxdWVzdEZ1bGxzY3JlZW47XG5cbiAgICAgICAgaWYgKC9GaXJlZm94L2kudGVzdChuYXZpZ2F0b3IudXNlckFnZW50KSkge1xuICAgICAgICAgIGNvbnN0IGZ1bGxzY3JlZW5jaGFuZ2UgPSAoKSA9PiB7XG4gICAgICAgICAgICBpZiAoZG9jdW1lbnQuZnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbHNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnRcbiAgICAgICAgICAgICAgfHwgZG9jdW1lbnQubW96RnVsbFNjcmVlbkVsZW1lbnQgPT09IGVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgZG9jdW1lbnQucmVtb3ZlRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UpO1xuICAgICAgICAgICAgICBkb2N1bWVudC5yZW1vdmVFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSk7XG5cbiAgICAgICAgICAgICAgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9O1xuXG4gICAgICAgICAgZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcignZnVsbHNjcmVlbmNoYW5nZScsIGZ1bGxzY3JlZW5jaGFuZ2UsIGZhbHNlKTtcbiAgICAgICAgICBkb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKCdtb3pmdWxsc2NyZWVuY2hhbmdlJywgZnVsbHNjcmVlbmNoYW5nZSwgZmFsc2UpO1xuXG4gICAgICAgICAgZWxlbWVudC5yZXF1ZXN0RnVsbHNjcmVlbigpO1xuICAgICAgICB9IGVsc2UgZWxlbWVudC5yZXF1ZXN0UG9pbnRlckxvY2soKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSBjb25zb2xlLndhcm4oJ1lvdXIgYnJvd3NlciBkb2VzIG5vdCBzdXBwb3J0IHRoZSBQb2ludGVyTG9jaycpO1xuXG4gICAgbWFuYWdlci5nZXQoJ3NjZW5lJykuYWRkKHRoaXMuY29udHJvbHMuZ2V0T2JqZWN0KCkpO1xuICB9XG5cbiAgaW50ZWdyYXRlKHNlbGYpIHtcbiAgICBjb25zdCB1cGRhdGVQcm9jZXNzb3IgPSBjID0+IHtcbiAgICAgIHNlbGYuY29udHJvbHMudXBkYXRlKGMuZ2V0RGVsdGEoKSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlTG9vcCA9IG5ldyBMb29wKHVwZGF0ZVByb2Nlc3Nvcikuc3RhcnQodGhpcyk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6WyJNRVNTQUdFX1RZUEVTIiwiV09STERSRVBPUlQiLCJDT0xMSVNJT05SRVBPUlQiLCJWRUhJQ0xFUkVQT1JUIiwiQ09OU1RSQUlOVFJFUE9SVCIsIlNPRlRSRVBPUlQiLCJSRVBPUlRfSVRFTVNJWkUiLCJDT0xMSVNJT05SRVBPUlRfSVRFTVNJWkUiLCJWRUhJQ0xFUkVQT1JUX0lURU1TSVpFIiwiQ09OU1RSQUlOVFJFUE9SVF9JVEVNU0laRSIsInRlbXAxVmVjdG9yMyIsIlZlY3RvcjMiLCJ0ZW1wMlZlY3RvcjMiLCJ0ZW1wMU1hdHJpeDQiLCJNYXRyaXg0IiwidGVtcDFRdWF0IiwiUXVhdGVybmlvbiIsImdldEV1bGVyWFlaRnJvbVF1YXRlcm5pb24iLCJ4IiwieSIsInoiLCJ3IiwiTWF0aCIsImF0YW4yIiwiYXNpbiIsImdldFF1YXRlcnRpb25Gcm9tRXVsZXIiLCJjMSIsImNvcyIsInMxIiwic2luIiwiYzIiLCJzMiIsImMzIiwiczMiLCJjMWMyIiwiczFzMiIsImNvbnZlcnRXb3JsZFBvc2l0aW9uVG9PYmplY3QiLCJwb3NpdGlvbiIsIm9iamVjdCIsImlkZW50aXR5IiwibWFrZVJvdGF0aW9uRnJvbVF1YXRlcm5pb24iLCJxdWF0ZXJuaW9uIiwiZ2V0SW52ZXJzZSIsImNvcHkiLCJzdWIiLCJhcHBseU1hdHJpeDQiLCJhZGRPYmplY3RDaGlsZHJlbiIsInBhcmVudCIsImkiLCJjaGlsZHJlbiIsImxlbmd0aCIsImNoaWxkIiwicGh5c2ljcyIsImNvbXBvbmVudCIsInVzZSIsImRhdGEiLCJ1cGRhdGVNYXRyaXgiLCJ1cGRhdGVNYXRyaXhXb3JsZCIsInNldEZyb21NYXRyaXhQb3NpdGlvbiIsIm1hdHJpeFdvcmxkIiwic2V0RnJvbVJvdGF0aW9uTWF0cml4IiwicG9zaXRpb25fb2Zmc2V0Iiwicm90YXRpb24iLCJwdXNoIiwiRXZlbnRhYmxlIiwiX2V2ZW50TGlzdGVuZXJzIiwiZXZlbnRfbmFtZSIsImNhbGxiYWNrIiwiaGFzT3duUHJvcGVydHkiLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJwYXJhbWV0ZXJzIiwiQXJyYXkiLCJwcm90b3R5cGUiLCJjYWxsIiwiYXJndW1lbnRzIiwiYXBwbHkiLCJvYmoiLCJhZGRFdmVudExpc3RlbmVyIiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsImRpc3BhdGNoRXZlbnQiLCJDb25lVHdpc3RDb25zdHJhaW50Iiwib2JqYSIsIm9iamIiLCJvYmplY3RhIiwib2JqZWN0YiIsInVuZGVmaW5lZCIsImNvbnNvbGUiLCJlcnJvciIsInR5cGUiLCJhcHBsaWVkSW1wdWxzZSIsIndvcmxkTW9kdWxlIiwiaWQiLCJwb3NpdGlvbmEiLCJjbG9uZSIsInBvc2l0aW9uYiIsImF4aXNhIiwiYXhpc2IiLCJleGVjdXRlIiwiY29uc3RyYWludCIsIm1heF9pbXB1bHNlIiwidGFyZ2V0Iiwic2V0RnJvbUV1bGVyIiwiRXVsZXIiLCJIaW5nZUNvbnN0cmFpbnQiLCJheGlzIiwibG93IiwiaGlnaCIsImJpYXNfZmFjdG9yIiwicmVsYXhhdGlvbl9mYWN0b3IiLCJ2ZWxvY2l0eSIsImFjY2VsZXJhdGlvbiIsIlBvaW50Q29uc3RyYWludCIsIlNsaWRlckNvbnN0cmFpbnQiLCJsaW5fbG93ZXIiLCJsaW5fdXBwZXIiLCJhbmdfbG93ZXIiLCJhbmdfdXBwZXIiLCJsaW5lYXIiLCJhbmd1bGFyIiwic2NlbmUiLCJET0ZDb25zdHJhaW50IiwibGltaXQiLCJ3aGljaCIsImxvd19hbmdsZSIsImhpZ2hfYW5nbGUiLCJtYXhfZm9yY2UiLCJWZWhpY2xlIiwibWVzaCIsInR1bmluZyIsIlZlaGljbGVUdW5pbmciLCJ3aGVlbHMiLCJfcGh5c2lqcyIsImdldE9iamVjdElkIiwicmlnaWRCb2R5Iiwic3VzcGVuc2lvbl9zdGlmZm5lc3MiLCJzdXNwZW5zaW9uX2NvbXByZXNzaW9uIiwic3VzcGVuc2lvbl9kYW1waW5nIiwibWF4X3N1c3BlbnNpb25fdHJhdmVsIiwiZnJpY3Rpb25fc2xpcCIsIm1heF9zdXNwZW5zaW9uX2ZvcmNlIiwid2hlZWxfZ2VvbWV0cnkiLCJ3aGVlbF9tYXRlcmlhbCIsImNvbm5lY3Rpb25fcG9pbnQiLCJ3aGVlbF9kaXJlY3Rpb24iLCJ3aGVlbF9heGxlIiwic3VzcGVuc2lvbl9yZXN0X2xlbmd0aCIsIndoZWVsX3JhZGl1cyIsImlzX2Zyb250X3doZWVsIiwid2hlZWwiLCJNZXNoIiwiY2FzdFNoYWRvdyIsInJlY2VpdmVTaGFkb3ciLCJtdWx0aXBseVNjYWxhciIsImFkZCIsIndvcmxkIiwiYW1vdW50Iiwic3RlZXJpbmciLCJicmFrZSIsImZvcmNlIiwiV29ybGRNb2R1bGVCYXNlIiwib3B0aW9ucyIsImJyaWRnZSIsIm9uQWRkIiwic2VsZiIsImRlZmVyIiwib25BZGRDYWxsYmFjayIsImJpbmQiLCJvblJlbW92ZSIsIm9uUmVtb3ZlQ2FsbGJhY2siLCJPYmplY3QiLCJhc3NpZ24iLCJkZWZhdWx0cyIsIm9iamVjdHMiLCJ2ZWhpY2xlcyIsImNvbnN0cmFpbnRzIiwiaXNTaW11bGF0aW5nIiwicmVjZWl2ZSIsIl90ZW1wIiwiZXZlbnQiLCJBcnJheUJ1ZmZlciIsImJ5dGVMZW5ndGgiLCJGbG9hdDMyQXJyYXkiLCJ1cGRhdGVTY2VuZSIsInVwZGF0ZVNvZnRib2RpZXMiLCJ1cGRhdGVDb2xsaXNpb25zIiwidXBkYXRlVmVoaWNsZXMiLCJ1cGRhdGVDb25zdHJhaW50cyIsImNtZCIsInBhcmFtcyIsIndpbmRvdyIsInRlc3QiLCJkZWJ1ZyIsImRpciIsImluZm8iLCJvZmZzZXQiLCJfX2RpcnR5UG9zaXRpb24iLCJzZXQiLCJfX2RpcnR5Um90YXRpb24iLCJsaW5lYXJWZWxvY2l0eSIsImFuZ3VsYXJWZWxvY2l0eSIsIlNVUFBPUlRfVFJBTlNGRVJBQkxFIiwic2VuZCIsImJ1ZmZlciIsInNpemUiLCJhdHRyaWJ1dGVzIiwiZ2VvbWV0cnkiLCJ2b2x1bWVQb3NpdGlvbnMiLCJhcnJheSIsIm9mZnNldFZlcnQiLCJpc1NvZnRCb2R5UmVzZXQiLCJ2b2x1bWVOb3JtYWxzIiwibm9ybWFsIiwib2ZmcyIsIngxIiwieTEiLCJ6MSIsIm54MSIsIm55MSIsIm56MSIsIngyIiwieTIiLCJ6MiIsIm54MiIsIm55MiIsIm56MiIsIngzIiwieTMiLCJ6MyIsIm54MyIsIm55MyIsIm56MyIsImk5IiwibmVlZHNVcGRhdGUiLCJueCIsIm55IiwibnoiLCJ2ZWhpY2xlIiwiZXh0cmFjdFJvdGF0aW9uIiwibWF0cml4IiwiYWRkVmVjdG9ycyIsImNvbGxpc2lvbnMiLCJub3JtYWxfb2Zmc2V0cyIsIm9iamVjdDIiLCJpZDEiLCJqIiwidG91Y2hlcyIsImlkMiIsImNvbXBvbmVudDIiLCJkYXRhMiIsInZlbCIsImdldExpbmVhclZlbG9jaXR5IiwidmVsMiIsInN1YlZlY3RvcnMiLCJ0ZW1wMSIsInRlbXAyIiwibm9ybWFsX29mZnNldCIsImVtaXQiLCJzaG93X21hcmtlciIsImdldERlZmluaXRpb24iLCJtYXJrZXIiLCJTcGhlcmVHZW9tZXRyeSIsIk1lc2hOb3JtYWxNYXRlcmlhbCIsIkJveEdlb21ldHJ5IiwibmF0aXZlIiwibWFuYWdlciIsIndpZHRoIiwic2NhbGUiLCJoZWlnaHQiLCJkZXB0aCIsInJlbW92ZSIsInBvcCIsImZ1bmMiLCJhcmdzIiwiUHJvbWlzZSIsInJlc29sdmUiLCJpc0xvYWRlZCIsImxvYWRlciIsInRoZW4iLCJkZWZpbmUiLCJ3b3JrZXIiLCJzZXRGaXhlZFRpbWVTdGVwIiwiZml4ZWRUaW1lU3RlcCIsInNldEdyYXZpdHkiLCJncmF2aXR5IiwiYWRkQ29uc3RyYWludCIsInNpbXVsYXRlIiwidGltZVN0ZXAiLCJtYXhTdWJTdGVwcyIsIl9zdGF0cyIsImJlZ2luIiwib2JqZWN0X2lkIiwidXBkYXRlIiwicG9zIiwiaXNTb2Z0Ym9keSIsInF1YXQiLCJlbmQiLCJzaW11bGF0ZUxvb3AiLCJMb29wIiwiY2xvY2siLCJnZXREZWx0YSIsInN0YXJ0IiwibG9nIiwicmF0ZUxpbWl0IiwiYW1tbyIsInNvZnRib2R5IiwiVEFSR0VUIiwiU3ltYm9sIiwiU0NSSVBUX1RZUEUiLCJCbG9iQnVpbGRlciIsIldlYktpdEJsb2JCdWlsZGVyIiwiTW96QmxvYkJ1aWxkZXIiLCJNU0Jsb2JCdWlsZGVyIiwiVVJMIiwid2Via2l0VVJMIiwiV29ya2VyIiwic2hpbVdvcmtlciIsImZpbGVuYW1lIiwiZm4iLCJTaGltV29ya2VyIiwiZm9yY2VGYWxsYmFjayIsIm8iLCJzb3VyY2UiLCJ0b1N0cmluZyIsInJlcGxhY2UiLCJzbGljZSIsIm9ialVSTCIsImNyZWF0ZVNvdXJjZU9iamVjdCIsInJldm9rZU9iamVjdFVSTCIsInNlbGZTaGltIiwicG9zdE1lc3NhZ2UiLCJtIiwib25tZXNzYWdlIiwic2V0VGltZW91dCIsImlzVGhpc1RocmVhZCIsInRlc3RXb3JrZXIiLCJ0ZXN0QXJyYXkiLCJVaW50OEFycmF5IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiRXJyb3IiLCJlIiwidGVybWluYXRlIiwic3RyIiwiY3JlYXRlT2JqZWN0VVJMIiwiQmxvYiIsImJsb2IiLCJhcHBlbmQiLCJnZXRCbG9iIiwiZG9jdW1lbnQiLCJFdmVudHMiLCJldmVudHMiLCJlbXB0eSIsIm9uIiwiY3R4Iiwib2ZmIiwibGlzdCIsImluc2lkZVdvcmtlciIsIndlYmtpdFBvc3RNZXNzYWdlIiwiYWIiLCJfb2JqZWN0IiwiX3ZlY3RvciIsIl90cmFuc2Zvcm0iLCJfdHJhbnNmb3JtX3BvcyIsIl9zb2Z0Ym9keV9lbmFibGVkIiwibGFzdF9zaW11bGF0aW9uX2R1cmF0aW9uIiwiX251bV9vYmplY3RzIiwiX251bV9yaWdpZGJvZHlfb2JqZWN0cyIsIl9udW1fc29mdGJvZHlfb2JqZWN0cyIsIl9udW1fd2hlZWxzIiwiX251bV9jb25zdHJhaW50cyIsIl9zb2Z0Ym9keV9yZXBvcnRfc2l6ZSIsIl92ZWMzXzEiLCJfdmVjM18yIiwiX3ZlYzNfMyIsIl9xdWF0IiwicHVibGljX2Z1bmN0aW9ucyIsIl9vYmplY3RzIiwiX3ZlaGljbGVzIiwiX2NvbnN0cmFpbnRzIiwiX29iamVjdHNfYW1tbyIsIl9vYmplY3Rfc2hhcGVzIiwiX21vdGlvbl9zdGF0ZXMiLCJfbm9uY2FjaGVkX3NoYXBlcyIsIl9jb21wb3VuZF9zaGFwZXMiLCJSRVBPUlRfQ0hVTktTSVpFIiwid29ybGRyZXBvcnQiLCJzb2Z0cmVwb3J0IiwiY29sbGlzaW9ucmVwb3J0IiwidmVoaWNsZXJlcG9ydCIsImNvbnN0cmFpbnRyZXBvcnQiLCJXT1JMRFJFUE9SVF9JVEVNU0laRSIsImdldFNoYXBlRnJvbUNhY2hlIiwiY2FjaGVfa2V5Iiwic2V0U2hhcGVDYWNoZSIsInNoYXBlIiwiY3JlYXRlU2hhcGUiLCJkZXNjcmlwdGlvbiIsInNldElkZW50aXR5IiwiQW1tbyIsImJ0Q29tcG91bmRTaGFwZSIsInNldFgiLCJzZXRZIiwic2V0WiIsImJ0U3RhdGljUGxhbmVTaGFwZSIsImJ0Qm94U2hhcGUiLCJyYWRpdXMiLCJidFNwaGVyZVNoYXBlIiwiYnRDeWxpbmRlclNoYXBlIiwiYnRDYXBzdWxlU2hhcGUiLCJidENvbmVTaGFwZSIsInRyaWFuZ2xlX21lc2giLCJidFRyaWFuZ2xlTWVzaCIsImFkZFRyaWFuZ2xlIiwiYnRCdmhUcmlhbmdsZU1lc2hTaGFwZSIsImJ0Q29udmV4SHVsbFNoYXBlIiwiYWRkUG9pbnQiLCJ4cHRzIiwieXB0cyIsInBvaW50cyIsInB0ciIsIl9tYWxsb2MiLCJwIiwicDIiLCJIRUFQRjMyIiwiYnRIZWlnaHRmaWVsZFRlcnJhaW5TaGFwZSIsImFic01heEhlaWdodCIsImNyZWF0ZVNvZnRCb2R5IiwiYm9keSIsInNvZnRCb2R5SGVscGVycyIsImJ0U29mdEJvZHlIZWxwZXJzIiwiYVZlcnRpY2VzIiwiQ3JlYXRlRnJvbVRyaU1lc2giLCJnZXRXb3JsZEluZm8iLCJhSW5kaWNlcyIsImNyIiwiY29ybmVycyIsIkNyZWF0ZVBhdGNoIiwiYnRWZWN0b3IzIiwic2VnbWVudHMiLCJDcmVhdGVSb3BlIiwiaW5pdCIsIm5vV29ya2VyIiwibWFrZVdvcmxkIiwid2FzbUJ1ZmZlciIsImltcG9ydFNjcmlwdHMiLCJsb2FkQW1tb0Zyb21CaW5hcnkiLCJidFRyYW5zZm9ybSIsImJ0UXVhdGVybmlvbiIsInJlcG9ydHNpemUiLCJjb2xsaXNpb25Db25maWd1cmF0aW9uIiwiYnRTb2Z0Qm9keVJpZ2lkQm9keUNvbGxpc2lvbkNvbmZpZ3VyYXRpb24iLCJidERlZmF1bHRDb2xsaXNpb25Db25maWd1cmF0aW9uIiwiZGlzcGF0Y2hlciIsImJ0Q29sbGlzaW9uRGlzcGF0Y2hlciIsInNvbHZlciIsImJ0U2VxdWVudGlhbEltcHVsc2VDb25zdHJhaW50U29sdmVyIiwiYnJvYWRwaGFzZSIsImFhYmJtaW4iLCJhYWJibWF4IiwiYnRBeGlzU3dlZXAzIiwiYnREYnZ0QnJvYWRwaGFzZSIsImJ0U29mdFJpZ2lkRHluYW1pY3NXb3JsZCIsImJ0RGVmYXVsdFNvZnRCb2R5U29sdmVyIiwiYnREaXNjcmV0ZUR5bmFtaWNzV29ybGQiLCJhcHBlbmRBbmNob3IiLCJub2RlIiwib2JqMiIsImNvbGxpc2lvbkJldHdlZW5MaW5rZWRCb2RpZXMiLCJpbmZsdWVuY2UiLCJsaW5rTm9kZXMiLCJzZWxmX2JvZHkiLCJvdGhlcl9ib2R5Iiwic2VsZl9ub2RlIiwiZ2V0X21fbm9kZXMiLCJhdCIsIm4xIiwib3RoZXJfbm9kZSIsIm4yIiwic2VsZl92ZWMiLCJnZXRfbV94Iiwib3RoZXJfdmVjIiwiZm9yY2VfeCIsImZvcmNlX3kiLCJmb3JjZV96IiwiY2FjaGVkX2Rpc3RhbmNlIiwibGlua2VkIiwiX2xvb3AiLCJzZXRJbnRlcnZhbCIsImRpc3RhbmNlIiwic3FydCIsInNldFZlbG9jaXR5IiwibW9kaWZlcjIiLCJtYXgiLCJtb2RpZmllciIsImFkZFZlbG9jaXR5IiwiYXBwZW5kTGluayIsImFkZEZvcmNlIiwiYXBwZW5kTGluZWFySm9pbnQiLCJzcGVjcyIsIlNwZWNzIiwiX3BvcyIsInNldF9wb3NpdGlvbiIsImVycCIsInNldF9lcnAiLCJjZm0iLCJzZXRfY2ZtIiwic3BsaXQiLCJzZXRfc3BsaXQiLCJhZGRPYmplY3QiLCJtb3Rpb25TdGF0ZSIsInNiQ29uZmlnIiwiZ2V0X21fY2ZnIiwidml0ZXJhdGlvbnMiLCJzZXRfdml0ZXJhdGlvbnMiLCJwaXRlcmF0aW9ucyIsInNldF9waXRlcmF0aW9ucyIsImRpdGVyYXRpb25zIiwic2V0X2RpdGVyYXRpb25zIiwiY2l0ZXJhdGlvbnMiLCJzZXRfY2l0ZXJhdGlvbnMiLCJzZXRfY29sbGlzaW9ucyIsInNldF9rREYiLCJmcmljdGlvbiIsInNldF9rRFAiLCJkYW1waW5nIiwicHJlc3N1cmUiLCJzZXRfa1BSIiwiZHJhZyIsInNldF9rREciLCJsaWZ0Iiwic2V0X2tMRiIsImFuY2hvckhhcmRuZXNzIiwic2V0X2tBSFIiLCJyaWdpZEhhcmRuZXNzIiwic2V0X2tDSFIiLCJrbHN0IiwiZ2V0X21fbWF0ZXJpYWxzIiwic2V0X21fa0xTVCIsImthc3QiLCJzZXRfbV9rQVNUIiwia3ZzdCIsInNldF9tX2tWU1QiLCJjYXN0T2JqZWN0IiwiYnRDb2xsaXNpb25PYmplY3QiLCJnZXRDb2xsaXNpb25TaGFwZSIsInNldE1hcmdpbiIsIm1hcmdpbiIsInNldEFjdGl2YXRpb25TdGF0ZSIsInN0YXRlIiwicm9wZSIsImNsb3RoIiwic2V0VyIsInJvdGF0ZSIsInRyYW5zbGF0ZSIsInNldFRvdGFsTWFzcyIsIm1hc3MiLCJhZGRTb2Z0Qm9keSIsImdldF9tX2ZhY2VzIiwiY29tcG91bmRfc2hhcGUiLCJhZGRDaGlsZFNoYXBlIiwiX2NoaWxkIiwidHJhbnMiLCJzZXRPcmlnaW4iLCJzZXRSb3RhdGlvbiIsImRlc3Ryb3kiLCJzZXRMb2NhbFNjYWxpbmciLCJjYWxjdWxhdGVMb2NhbEluZXJ0aWEiLCJidERlZmF1bHRNb3Rpb25TdGF0ZSIsInJiSW5mbyIsImJ0UmlnaWRCb2R5Q29uc3RydWN0aW9uSW5mbyIsInNldF9tX2ZyaWN0aW9uIiwic2V0X21fcmVzdGl0dXRpb24iLCJyZXN0aXR1dGlvbiIsInNldF9tX2xpbmVhckRhbXBpbmciLCJzZXRfbV9hbmd1bGFyRGFtcGluZyIsImJ0UmlnaWRCb2R5IiwiY29sbGlzaW9uX2ZsYWdzIiwic2V0Q29sbGlzaW9uRmxhZ3MiLCJncm91cCIsIm1hc2siLCJhZGRSaWdpZEJvZHkiLCJhY3RpdmF0ZSIsImEiLCJhZGRWZWhpY2xlIiwidmVoaWNsZV90dW5pbmciLCJidFZlaGljbGVUdW5pbmciLCJzZXRfbV9zdXNwZW5zaW9uU3RpZmZuZXNzIiwic2V0X21fc3VzcGVuc2lvbkNvbXByZXNzaW9uIiwic2V0X21fc3VzcGVuc2lvbkRhbXBpbmciLCJzZXRfbV9tYXhTdXNwZW5zaW9uVHJhdmVsQ20iLCJzZXRfbV9tYXhTdXNwZW5zaW9uRm9yY2UiLCJidFJheWNhc3RWZWhpY2xlIiwiYnREZWZhdWx0VmVoaWNsZVJheWNhc3RlciIsInNldENvb3JkaW5hdGVTeXN0ZW0iLCJyZW1vdmVWZWhpY2xlIiwiYWRkV2hlZWwiLCJzZXRTdGVlcmluZyIsImRldGFpbHMiLCJzZXRTdGVlcmluZ1ZhbHVlIiwic2V0QnJha2UiLCJhcHBseUVuZ2luZUZvcmNlIiwicmVtb3ZlT2JqZWN0IiwicmVtb3ZlU29mdEJvZHkiLCJyZW1vdmVSaWdpZEJvZHkiLCJ1cGRhdGVUcmFuc2Zvcm0iLCJnZXRNb3Rpb25TdGF0ZSIsImdldFdvcmxkVHJhbnNmb3JtIiwic2V0V29ybGRUcmFuc2Zvcm0iLCJ0cmFuc2Zvcm0iLCJ1cGRhdGVNYXNzIiwic2V0TWFzc1Byb3BzIiwiYXBwbHlDZW50cmFsSW1wdWxzZSIsImFwcGx5SW1wdWxzZSIsImltcHVsc2VfeCIsImltcHVsc2VfeSIsImltcHVsc2VfeiIsImFwcGx5VG9ycXVlIiwidG9ycXVlX3giLCJ0b3JxdWVfeSIsInRvcnF1ZV96IiwiYXBwbHlDZW50cmFsRm9yY2UiLCJhcHBseUZvcmNlIiwib25TaW11bGF0aW9uUmVzdW1lIiwibGFzdF9zaW11bGF0aW9uX3RpbWUiLCJzZXRBbmd1bGFyVmVsb2NpdHkiLCJzZXRMaW5lYXJWZWxvY2l0eSIsInNldEFuZ3VsYXJGYWN0b3IiLCJzZXRMaW5lYXJGYWN0b3IiLCJzZXREYW1waW5nIiwic2V0Q2NkTW90aW9uVGhyZXNob2xkIiwidGhyZXNob2xkIiwic2V0Q2NkU3dlcHRTcGhlcmVSYWRpdXMiLCJidFBvaW50MlBvaW50Q29uc3RyYWludCIsImJ0SGluZ2VDb25zdHJhaW50IiwidHJhbnNmb3JtYiIsInRyYW5zZm9ybWEiLCJnZXRSb3RhdGlvbiIsInNldEV1bGVyIiwiYnRTbGlkZXJDb25zdHJhaW50IiwidGEiLCJ0YiIsInNldEV1bGVyWllYIiwiYnRDb25lVHdpc3RDb25zdHJhaW50Iiwic2V0TGltaXQiLCJQSSIsImJ0R2VuZXJpYzZEb2ZDb25zdHJhaW50IiwiYiIsImVuYWJsZUZlZWRiYWNrIiwicmVtb3ZlQ29uc3RyYWludCIsImNvbnN0cmFpbnRfc2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwic2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwiY2VpbCIsInN0ZXBTaW11bGF0aW9uIiwicmVwb3J0VmVoaWNsZXMiLCJyZXBvcnRDb2xsaXNpb25zIiwicmVwb3J0Q29uc3RyYWludHMiLCJyZXBvcnRXb3JsZCIsInJlcG9ydFdvcmxkX3NvZnRib2RpZXMiLCJoaW5nZV9zZXRMaW1pdHMiLCJoaW5nZV9lbmFibGVBbmd1bGFyTW90b3IiLCJlbmFibGVBbmd1bGFyTW90b3IiLCJoaW5nZV9kaXNhYmxlTW90b3IiLCJlbmFibGVNb3RvciIsInNsaWRlcl9zZXRMaW1pdHMiLCJzZXRMb3dlckxpbkxpbWl0Iiwic2V0VXBwZXJMaW5MaW1pdCIsInNldExvd2VyQW5nTGltaXQiLCJzZXRVcHBlckFuZ0xpbWl0Iiwic2xpZGVyX3NldFJlc3RpdHV0aW9uIiwic2V0U29mdG5lc3NMaW1MaW4iLCJzZXRTb2Z0bmVzc0xpbUFuZyIsInNsaWRlcl9lbmFibGVMaW5lYXJNb3RvciIsInNldFRhcmdldExpbk1vdG9yVmVsb2NpdHkiLCJzZXRNYXhMaW5Nb3RvckZvcmNlIiwic2V0UG93ZXJlZExpbk1vdG9yIiwic2xpZGVyX2Rpc2FibGVMaW5lYXJNb3RvciIsInNsaWRlcl9lbmFibGVBbmd1bGFyTW90b3IiLCJzZXRUYXJnZXRBbmdNb3RvclZlbG9jaXR5Iiwic2V0TWF4QW5nTW90b3JGb3JjZSIsInNldFBvd2VyZWRBbmdNb3RvciIsInNsaWRlcl9kaXNhYmxlQW5ndWxhck1vdG9yIiwiY29uZXR3aXN0X3NldExpbWl0IiwiY29uZXR3aXN0X2VuYWJsZU1vdG9yIiwiY29uZXR3aXN0X3NldE1heE1vdG9ySW1wdWxzZSIsInNldE1heE1vdG9ySW1wdWxzZSIsImNvbmV0d2lzdF9zZXRNb3RvclRhcmdldCIsInNldE1vdG9yVGFyZ2V0IiwiY29uZXR3aXN0X2Rpc2FibGVNb3RvciIsImRvZl9zZXRMaW5lYXJMb3dlckxpbWl0Iiwic2V0TGluZWFyTG93ZXJMaW1pdCIsImRvZl9zZXRMaW5lYXJVcHBlckxpbWl0Iiwic2V0TGluZWFyVXBwZXJMaW1pdCIsImRvZl9zZXRBbmd1bGFyTG93ZXJMaW1pdCIsInNldEFuZ3VsYXJMb3dlckxpbWl0IiwiZG9mX3NldEFuZ3VsYXJVcHBlckxpbWl0Iiwic2V0QW5ndWxhclVwcGVyTGltaXQiLCJkb2ZfZW5hYmxlQW5ndWxhck1vdG9yIiwibW90b3IiLCJnZXRSb3RhdGlvbmFsTGltaXRNb3RvciIsInNldF9tX2VuYWJsZU1vdG9yIiwiZG9mX2NvbmZpZ3VyZUFuZ3VsYXJNb3RvciIsInNldF9tX2xvTGltaXQiLCJzZXRfbV9oaUxpbWl0Iiwic2V0X21fdGFyZ2V0VmVsb2NpdHkiLCJzZXRfbV9tYXhNb3RvckZvcmNlIiwiZG9mX2Rpc2FibGVBbmd1bGFyTW90b3IiLCJnZXRDZW50ZXJPZk1hc3NUcmFuc2Zvcm0iLCJvcmlnaW4iLCJnZXRPcmlnaW4iLCJnZXRBbmd1bGFyVmVsb2NpdHkiLCJub2RlcyIsInZlcnQiLCJnZXRfbV9uIiwiZmFjZXMiLCJmYWNlIiwibm9kZTEiLCJub2RlMiIsIm5vZGUzIiwidmVydDEiLCJ2ZXJ0MiIsInZlcnQzIiwibm9ybWFsMSIsIm5vcm1hbDIiLCJub3JtYWwzIiwiZHAiLCJnZXREaXNwYXRjaGVyIiwibnVtIiwiZ2V0TnVtTWFuaWZvbGRzIiwibWFuaWZvbGQiLCJnZXRNYW5pZm9sZEJ5SW5kZXhJbnRlcm5hbCIsIm51bV9jb250YWN0cyIsImdldE51bUNvbnRhY3RzIiwicHQiLCJnZXRDb250YWN0UG9pbnQiLCJnZXRCb2R5MCIsImdldEJvZHkxIiwiZ2V0X21fbm9ybWFsV29ybGRPbkIiLCJnZXROdW1XaGVlbHMiLCJnZXRXaGVlbEluZm8iLCJnZXRfbV93b3JsZFRyYW5zZm9ybSIsImxlbmdodCIsIm9mZnNldF9ib2R5IiwiZ2V0QnJlYWtpbmdJbXB1bHNlVGhyZXNob2xkIiwiV29ybGRNb2R1bGUiLCJQaHlzaWNzV29ya2VyIiwidHJhbnNmZXJhYmxlTWVzc2FnZSIsInJlamVjdCIsInNldHVwIiwicHJvcGVydGllcyIsImdldCIsIl9uYXRpdmUiLCJ2ZWN0b3IzIiwic2NvcGUiLCJkZWZpbmVQcm9wZXJ0aWVzIiwiX3giLCJfeSIsIl96IiwiX19jX3JvdCIsIm9uQ2hhbmdlIiwiZXVsZXIiLCJyb3QiLCJ3cmFwUGh5c2ljc1Byb3RvdHlwZSIsImtleSIsImRlZmluZVByb3BlcnR5IiwiY29uZmlndXJhYmxlIiwiZW51bWVyYWJsZSIsIm9uQ29weSIsInNvdXJjZVBoeXNpY3MiLCJtb2R1bGVzIiwib25XcmFwIiwiQVBJIiwiZmFjdG9yIiwiaGFzIiwibW9kdWxlIiwicmVzdWx0IiwiY29uc3RydWN0b3IiLCJyaWdpZGJvZHkiLCJCb3hNb2R1bGUiLCJQaHlzaWNzTW9kdWxlIiwidXBkYXRlRGF0YSIsImJvdW5kaW5nQm94IiwiY29tcHV0ZUJvdW5kaW5nQm94IiwibWluIiwiQ29tcG91bmRNb2R1bGUiLCJDYXBzdWxlTW9kdWxlIiwiQ29uY2F2ZU1vZHVsZSIsImdlb21ldHJ5UHJvY2Vzc29yIiwiaXNCdWZmZXJHZW9tZXRyeSIsInZlcnRpY2VzIiwidkEiLCJ2QiIsInZDIiwiYyIsIkNvbmVNb2R1bGUiLCJDb252ZXhNb2R1bGUiLCJfYnVmZmVyR2VvbWV0cnkiLCJCdWZmZXJHZW9tZXRyeSIsImZyb21HZW9tZXRyeSIsIkN5bGluZGVyTW9kdWxlIiwiSGVpZ2h0ZmllbGRNb2R1bGUiLCJWZWN0b3IyIiwiYXV0b0FsaWduIiwieGRpdiIsInlkaXYiLCJ2ZXJ0cyIsInhzaXplIiwieXNpemUiLCJhYnMiLCJ2TnVtIiwicm91bmQiLCJtdWx0aXBseSIsIlBsYW5lTW9kdWxlIiwiU3BoZXJlTW9kdWxlIiwiYm91bmRpbmdTcGhlcmUiLCJjb21wdXRlQm91bmRpbmdTcGhlcmUiLCJTb2Z0Ym9keU1vZHVsZSIsImlkeEdlb21ldHJ5IiwibWVyZ2VWZXJ0aWNlcyIsImJ1ZmZlckdlb21ldHJ5IiwiYWRkQXR0cmlidXRlIiwiQnVmZmVyQXR0cmlidXRlIiwiY29weVZlY3RvcjNzQXJyYXkiLCJzZXRJbmRleCIsIlVpbnQzMkFycmF5IiwiVWludDE2QXJyYXkiLCJjb3B5SW5kaWNlc0FycmF5IiwibzEiLCJvMiIsImFycmF5TWF4IiwiSW5maW5pdHkiLCJsIiwiQ2xvdGhNb2R1bGUiLCJnZW9tUGFyYW1zIiwiZ2VvbSIsImZhY2VzTGVuZ3RoIiwidXZzIiwiZmFjZVZlcnRleFV2cyIsIm5vcm1hbHNBcnJheSIsInV2c0FycmF5IiwiZmFjZUFycmF5IiwiaTMiLCJ3aWR0aFNlZ21lbnRzIiwiaGVpZ2h0U2VnbWVudHMiLCJpZHgwMCIsImlkeDAxIiwiaWR4MTAiLCJpZHgxMSIsIlJvcGVNb2R1bGUiLCJidWZmIiwiZnJvbUFycmF5IiwibiIsInYxIiwidjIiLCJQSV8yIiwiRmlyc3RQZXJzb25Db250cm9sc1NvbHZlciIsImNhbWVyYSIsInZlbG9jaXR5RmFjdG9yIiwicnVuVmVsb2NpdHkiLCJwbGF5ZXIiLCJwaXRjaE9iamVjdCIsIk9iamVjdDNEIiwieWF3T2JqZWN0IiwieXBvcyIsImNhbkp1bXAiLCJtb3ZlRm9yd2FyZCIsIm1vdmVCYWNrd2FyZCIsIm1vdmVMZWZ0IiwibW92ZVJpZ2h0Iiwib3RoZXJPYmplY3QiLCJ2IiwiciIsImNvbnRhY3ROb3JtYWwiLCJvbk1vdXNlTW92ZSIsImVuYWJsZWQiLCJtb3ZlbWVudFgiLCJtb3pNb3ZlbWVudFgiLCJnZXRNb3ZlbWVudFgiLCJtb3ZlbWVudFkiLCJtb3pNb3ZlbWVudFkiLCJnZXRNb3ZlbWVudFkiLCJvbktleURvd24iLCJrZXlDb2RlIiwib25LZXlVcCIsImdldE9iamVjdCIsImdldERpcmVjdGlvbiIsInRhcmdldFZlYyIsIm11bHRpcGx5VmVjdG9yMyIsImlucHV0VmVsb2NpdHkiLCJkZWx0YSIsInNwZWVkIiwib3JkZXIiLCJhcHBseVF1YXRlcm5pb24iLCJGaXJzdFBlcnNvbk1vZHVsZSIsImJsb2NrIiwiZ2V0RWxlbWVudEJ5SWQiLCJjb250cm9scyIsImVsZW1lbnQiLCJwb2ludGVybG9ja2NoYW5nZSIsInBvaW50ZXJMb2NrRWxlbWVudCIsIm1velBvaW50ZXJMb2NrRWxlbWVudCIsIndlYmtpdFBvaW50ZXJMb2NrRWxlbWVudCIsInN0eWxlIiwiZGlzcGxheSIsInBvaW50ZXJsb2NrZXJyb3IiLCJ3YXJuIiwicXVlcnlTZWxlY3RvciIsInJlcXVlc3RQb2ludGVyTG9jayIsIm1velJlcXVlc3RQb2ludGVyTG9jayIsIndlYmtpdFJlcXVlc3RQb2ludGVyTG9jayIsInJlcXVlc3RGdWxsc2NyZWVuIiwibW96UmVxdWVzdEZ1bGxzY3JlZW4iLCJtb3pSZXF1ZXN0RnVsbFNjcmVlbiIsIndlYmtpdFJlcXVlc3RGdWxsc2NyZWVuIiwiZnVsbHNjcmVlbmNoYW5nZSIsImZ1bGxzY3JlZW5FbGVtZW50IiwibW96RnVsbHNjcmVlbkVsZW1lbnQiLCJtb3pGdWxsU2NyZWVuRWxlbWVudCIsInVwZGF0ZVByb2Nlc3NvciIsInVwZGF0ZUxvb3AiLCJkaXJlY3Rpb24iLCJUSFJFRSIsImltcHVsc2VfbGVuZ3RoIiwicmFuZ2Vfc2NhbGUiLCJpbnB1dCIsImluaXRfbG93IiwiaW5pdF9oaWdoIiwiZmluYWxfbG93IiwiZmluYWxfaGlnaCIsIlRoaXJkUGVyc29uQ29udHJvbHNTb2x2ZXIiLCJnZXRXb3JsZERpcmVjdGlvbiIsImFuZ2xlIiwicmFkVG9EZWciLCJhdGFuIiwicmFkaWFucyIsImRlZ1RvUmFkIiwibm9ybWFsaXplIiwiZHQiLCJUaGlyZFBlcnNvbk1vZHVsZSJdLCJtYXBwaW5ncyI6Ijs7Ozs7O01BTU1BLGdCQUFnQjtFQUNwQkMsZUFBYSxDQURPO0VBRXBCQyxtQkFBaUIsQ0FGRztFQUdwQkMsaUJBQWUsQ0FISztFQUlwQkMsb0JBQWtCLENBSkU7RUFLcEJDLGNBQVk7RUFMUSxDQUF0Qjs7QUFRQSxNQUFNQyxrQkFBa0IsRUFBeEI7RUFBQSxJQUNFQywyQkFBMkIsQ0FEN0I7RUFBQSxJQUVFQyx5QkFBeUIsQ0FGM0I7RUFBQSxJQUdFQyw0QkFBNEIsQ0FIOUI7O0FBS0EsTUFBTUMsZUFBZSxJQUFJQyxhQUFKLEVBQXJCO0VBQUEsSUFDRUMsZUFBZSxJQUFJRCxhQUFKLEVBRGpCO0VBQUEsSUFFRUUsZUFBZSxJQUFJQyxhQUFKLEVBRmpCO0VBQUEsSUFHRUMsWUFBWSxJQUFJQyxnQkFBSixFQUhkOztBQUtBLE1BQU1DLDRCQUE0QixTQUE1QkEseUJBQTRCLENBQUNDLENBQUQsRUFBSUMsQ0FBSixFQUFPQyxDQUFQLEVBQVVDLENBQVYsRUFBZ0I7RUFDaEQsU0FBTyxJQUFJVixhQUFKLENBQ0xXLEtBQUtDLEtBQUwsQ0FBVyxLQUFLTCxJQUFJRyxDQUFKLEdBQVFGLElBQUlDLENBQWpCLENBQVgsRUFBaUNDLElBQUlBLENBQUosR0FBUUgsSUFBSUEsQ0FBWixHQUFnQkMsSUFBSUEsQ0FBcEIsR0FBd0JDLElB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
