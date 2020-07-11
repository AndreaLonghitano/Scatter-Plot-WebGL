"use strict";
function QuaternionToEuler(quat) {

  const q0 = quat.w;
  const q1 = quat.x;
  const q2 = quat.y;
  const q3 = quat.z;

  const Rx = Math.atan2(2 * (q0 * q1 + q2 * q3), 1 - (2 * (q1 * q1 + q2 * q2)));
  const Ry = Math.asin(2 * (q0 * q2 - q3 * q1));
  const Rz = Math.atan2(2 * (q0 * q3 + q1 * q2), 1 - (2  * (q2 * q2 + q3 * q3)));

  const euler = [Rx, Ry, Rz];

  return(euler);
};