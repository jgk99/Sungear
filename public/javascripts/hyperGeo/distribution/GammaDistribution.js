/*
Radhika Mattoo, February 2016 N.Y.

Porting Sungear from Java to Javascript,
Translated from Ilyas Mounaime's Java code

*/
  var AbstractRealDistribution = require("./AbstractRealDistribution");
  var NotStrictlyPositiveException = require("../exception/NotStrictlyPositiveException");
var Gamma = require("../special/Gamma");
var LocalizedFormats = require("../exception/util/LocalizedFormats");
var seedrandom = require("seedrandom");
var FastMath = require("../util/FastMath");

  GammaDistribution.prototype = Object.create(AbstractRealDistribution.prototype);
  GammaDistribution.prototype.constructor = GammaDistribution;

GammaDistribution.DEFAULT_INVERSE_ABSOLUTE_ACCURACY = 1e-9;


function GammaDistribution(rng, shape, scale, inverseCumAccuracy){
    var passedRNG;
    var passedShape;
    var passedScale;
    var passedAccuracy;
    if(arguments.length == 2){//(shape, scale)
      passedRNG = seedrandom();
      passedShape = rng;
      passedScale = shape;
      passedAccuracy = DEFAULT_INVERSE_ABSOLUTE_ACCURACY;

    }else if(arguments.length == 3){//(shape, scale, inverseCumAccuracy)
      passedRNG = seedrandom();
      passedShape = rng;
      passedScale = shape;
      passedAccuracy = scale;
    }else{ //all 4arguments
      passedRNG = rng;
      passedShape = shape;
      passedScale = scale;
      passedAccuracy = inverseCumAccuracy;
    }
    AbstractRealDistribution.call(this, passedRNG);
    if(passedShape <= 0){throw new NotStrictlyPositiveException(LocalizedFormats.SHAPE, passedShape);}
    if(passedScale <= 0){throw new NotStrictlyPositiveException(LocalizedFormats.SHAPE, passedScale);}

    this.shape = passedShape;
    this.scale = passedscale;
    this.solverAbsoluteAccuracy = passedAccuracy;
    this.shiftedShape = this.shape + Gamma.LANCZOS_G + 0.5;
    var aux = Math.E / (2.0 * Math.PI * this.shiftedShape);
    this.densityPrefactor2 = this.shape * Math.sqrt(aux)/Gamma.lanczos(this.shape);
    this.densityPrefactor1 = this.densityPrefactor2/ this.scale * Math.pow(this.shiftedShape, -this.shape) * Math.exp(this.shape + Gamma.LANCZOS_G);
    this.minY = this.shape + Gamma.LANCZOS_G - Math.log(Number.MAX_VALUE);
    this.maxLogY = Math.log(Number.MAX_VALUE) / (this.shape - 1.0);

  }

  GammaDistribution.prototype.density = function(x){

    if (x < 0) {
        return 0;
    }
    var y = x / this.scale;
    if ((y <= this.minY) || (Math.log(y) >= this.maxLogY)) {
        /*
         * Overflow.
         */
        var aux1 = (y - this.shiftedShape) / this.shiftedShape;
        var aux2 = this.shape * (FastMath.log1p(aux1) - aux1);
        var aux3 = -y * (Gamma.LANCZOS_G + 0.5) / this.shiftedShape +
                Gamma.LANCZOS_G + aux2;
        return this.densityPrefactor2 / x * Math.exp(aux3);
    }
    /*
     * Natural calculation.
     */
    return this.densityPrefactor1  * Math.exp(-y) *
            Math.pow(y, this.shape - 1);
  };

  GammaDistribution.prototype.cumulativeProbability = function(x) {
    var ret;
    if (x <= 0) {
        ret = 0;
    }else{
        ret = Gamma.regularizedGammaP(this.shape, x / this.scale);
    }

    return ret;
  };

  GammaDistribution.prototype.getShape = function(){ return this.shape;};
  GammaDistribution.prototype.getScale = function(){ return this.scale;};
  GammaDistribution.prototype.getSolverAbsoluteAccuracy = function() {return this.solverAbsoluteAccuracy;};
  GammaDistribution.prototype.getNumericalMean = function() {return this.shape * this.scale;};
  GammaDistribution.prototype.getNumericalVariance = function() {return this.shape * this.scale * this.scale;};
  GammaDistribution.prototype.getSupportLowerBound = function() {return 0;};
  GammaDistribution.prototype.getSupportUpperBound = function () {return Number.POSITIVE_INFINITY;};
  GammaDistribution.prototype.isSupportLowerBoundInclusive = function() {return true;};
  GammaDistribution.prototype.isSupportUpperBoundInclusive = function() {return false;};
  GammaDistribution.prototype.isSupportConnected = function() {return true;};
  GammaDistribution.prototype.sample = function(){
    if (this.shape < 1) {
        // [1]: p. 228, Algorithm GS
        while (true) {
            // Step 1:
            var u = this.random();
            var bGS = 1 + this.shape / FastMath.E;
            var p = bGS * u;

            if (p <= 1) {
                // Step 2:
                var x = Math.pow(p, 1 / shape);
                var u2 = this.random();

                if (u2 > Math.exp(-x)) {
                    // Reject
                    continue;
                } else {
                    return this.scale * x;
                }
            } else {
                // Step 3:
                var x = -1 * Math.log((bGS - p) / this.shape);
                var u2 = this.random();

                if (u2 > Math.pow(x, this.shape - 1)) {
                    // Reject
                    continue;
                } else {
                    return this.scale * x;
                }
            }
        }
    }
    // Now shape >= 1
    var d = this.shape - 0.333333333333333333;
    var c = 1 / (3 * Math.sqrt(d));

    while(true) {
        var x = this.random();
        var v = (1 + c * x) * (1 + c * x) * (1 + c * x);

        if (v <= 0) {
            continue;
        }
        var x2 = x * x;
        var u = this.random();

        // Squeeze
        if (u < 1 - 0.0331 * x2 * x2) {
            return this.scale * d * v;
        }

        if (Math.log(u) < 0.5 * x2 + d * (1 - v + Math.log(v))) {
            return this.scale * d * v;
        }
    }
  };

  module.exports = GammaDistribution;