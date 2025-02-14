const { writeFileSync, readFileSync } = require('fs');
const { buildSystem } = require('./systemBuilder');
const { solve } = require('./systemSolver');
const { getExpression } = require('./helpers');

const createModel = () => {

  let params = {};

  const fit = (data,degrees) => {
    degrees.forEach(degree => {
      const system = buildSystem(data, degree);
      const coefficients = solve(...system);
      params[degree] = coefficients;
    });
  };

  const estimate = (degree,x) => params[degree] && params[degree].reduce((acc,c,i)=>acc+c*x**i,0);

  const loadParams = path => {
    const loadedData = JSON.parse(readFileSync(path));
    params = { ...params, ...loadedData };
  };

  const saveParams = path => writeFileSync(path, JSON.stringify(params, null, 2));

  const saveExpressions = path => {
    const paramsWithExpressions = Object.entries(params).reduce((acc,[degree,coefficients]) => {
      acc[degree] = getExpression(coefficients);
      return acc;
    },{});
    writeFileSync(path, JSON.stringify(paramsWithExpressions, null, 2));
  };
  
  const expressions = () => {
    return Object.entries(params).reduce((acc,[degree,coefficients]) => {
      acc[degree] = getExpression(coefficients);
      return acc;
    },{});
  };

  const getParams = degree => {
    return params[degree];
  }

  const estimateX = (degree, y) => {
    if (degree === 2) {
      let [ c, b, a ] = params[2];
  
      c -= y;
    
      if (a === 0) {
        if (b === 0) {
          return null;
        } else {
          return [ -c / b ];
        }
      }
    
      const d = b * b - 4 * a * c;
    
      if (d < 0) {
        return null;
      }
    
      if (d === 0) {
        const r = -0.5 * b / a;
    
        return [ r, r ];
      }
    
      const q = -0.5 * (b + Math.sign(b) * Math.sqrt(d));
      const one = q / a, two = c / q;
      
      return one > 0 && two > 0 ? Math.min(one, two) : one <= 0 ? two : one;
    }

    const [ a, b ] = params[1];

    return (y - a) / b;
  };

  return { fit, estimate, loadParams, saveParams, saveExpressions, expressions, estimateX, getParams };
};

module.exports = {
  createModel
};
