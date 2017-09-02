"use strict";
/**
 * AnchorDisplay objects are short titles fixed on each corner of the gear's main outer shape (or just top and bottom if the gear is a circle).
 * There should be one AnchorDisplay to each Anchor (and one Anchor to each Gene Set).
 *
 * @mvc View
 * @author RajahBimmy
 */

const DataReader = require('../../data/dataReader');
const SunValues = require('./sunValues');

function AnchorDisplay(anchor) {
    this.anchor = anchor;       /** {Anchor} 1 to 1 relationship */
    this.highlight = false;
    this.select = false;
    this.showLongDesc = false;  /** {boolean} True to show long anchor description, false for short */
    this._scale = 1;            /** {number} double */
    // this.textScale = 1;         /** {Number} double Scale for text size. Possibly unused? */
    this.angle = NaN;          /** {number} Angling of AnchorDisplay relative to Gear's main component */

    const s = DataReader.trimAll(this.anchor.name.split(AnchorDisplay.NAME_SEPARATOR));
    this.shortDesc = s[0];      /** {string} Short anchor text for default display */
    this.longDesc = (s.length > 1) ? s[1] : this.shortDesc; /** {string} Long anchor text to display on rollover */
    this.vessels = [];          /** {Array} of VesselDisplays */
    this._shape = null;          /** {Shape} */
    this.position = {};       /** {object with x and y coordinates} */
    this.contains = false;
    this.debug = true;
    // this.physLocation = {}; /** X & Y locations of name in sungear */

    this.bounds = null;
}

AnchorDisplay.NAME_SEPARATOR = ";";

AnchorDisplay.prototype = {
    constructor : AnchorDisplay,

    cleanup : function() {
        this.anchor.cleanup();
    },
    /** @param s {number} double */
    setScale : function(s) {
        this._scale = s;
        if(!isNaN(this.angle)) {
            this.setAngle(this.angle);
        }
    },
    /** @function setTextScale was removed */
    /**
     * This function should be called on each unique AnchorDisplay to offset their angles from the gear's center.
     * Likely calling function is SunValues.makeDisplay
     *
     *
     */
    getAnchorToShow : function(){
        return this.showLongDesc ? this.longDesc : this.shortDesc;
    },

    setBounds : function(bounds) {
        this.bounds = bounds;
    },
    // @param theta {Number} double
    setAngle : function(theta) {
        this.angle = theta;
        this.position.x = SunValues.R_CIRCLE * Math.cos(theta);
        this.position.y = SunValues.R_CIRCLE * Math.sin(theta);
    },
    /** @return {Number} double */
    getAngle : function() {
        return this.angle;
    },
    /** @param b {boolean} */
    setHighlight : function(b) {
        this.highlight = b;
    },
    /** @return {boolean} */
    getHighlight : function() {
        return this.highlight;
    },
    /**
     * This function either highlights or removes the highlight from each individual vessel.
     *
     * @param b {boolean}
     */
    highlightVessels : function(b) {
        for (let i = 0; i < this.vessels.length; i++) {
            this.vessels[i].setHighlight(b);
        }
    },
    /** @param b {boolean} */
    setSelect : function(b) {
        this.select = b;
    },
    /**
     * @returns {boolean}
     */
    getSelect : function() {
        return this.select;
    },
    /** @param b {boolean} */
    setShowLongDesc : function(b) {
        this.showLongDesc = b;
    },
    /**
     * @returns {boolean}
     */
    isShowLongDesc : function() {
        return this.showLongDesc;
    },
    /**
     * Principle drawing function used in the p5.draw loop
     * Likely called by SunValues.paintComponent
     *
     * @param p5 {p5} processing library
     * @param drawT {Object} Coordinates to use as basis.
     */
    draw : function(p5, drawT) {
        const tx = drawT.x;
        const ty = drawT.y;
        const tm = Math.min(tx, ty);
        const scale = drawT.scale / 192.91666666666669;
        const off = 34*scale;
        p5.textSize(18);
        p5.textAlign(p5.CENTER, p5.CENTER);
        const l = this.getAnchorToShow();


        let color = SunValues.C_PLAIN;
        color = (this.select ? SunValues.C_SELECT : (this.highlight ? SunValues.C_HIGHLIGHT : color));
        
        const location = this.findAnchorCorner(tx, ty, tm, off);

    

        let bound = this.bounds;
        let center = {x: tx, y : ty};
        let radius = off + tm/1.19;
        let tempAngle = this.angle -  Math.PI / 2.;
        let ang = tempAngle; 
        let anchorCoor = {x : center.x + radius * Math.cos(-1 * ang + Math.PI / 2), y: center.y - radius * Math.sin(-1 * ang + Math.PI / 2)};
        let anchorPointCombos = [[bound.w / 1.95 + 5, bound.h / 1.95 + 5],[bound.w / 1.95 + 5, -bound.h / 1.95 - 5], [-bound.w / 1.95 - 5, -bound.h / 1.95 - 5], [-bound.w / 1.95 -5, bound.h / 1.95 + 5]].map(
            wh=> [anchorCoor.x + wh[0], anchorCoor.y + wh[1]]
            );
        let anchorCorners = this.rotateTransform(anchorPointCombos, -ang, [anchorCoor.x , anchorCoor.y]);;
        
        let anchorCornersForContains = [{x: anchorCorners[0][0],y: anchorCorners[0][1]},{x: anchorCorners[1][0],y: anchorCorners[1][1]},{x: anchorCorners[2][0],y: anchorCorners[2][1]},{x: anchorCorners[3][0],y: anchorCorners[3][1]}];
        let rectangleEdges = [[0,1], [1,2], [2,3], [3,0]];

        

        let containsQ2 = this.polygonContainsQ(4, anchorCorners.map(pt => pt[0]), anchorCorners.map(pt => pt[1]), p5.mouseX, p5.mouseY);
        
        if (containsQ2) {
            if (p5.mouseIsPressed) {
                color = SunValues.C_SELECT;
            } else {
                color = SunValues.C_HIGHLIGHT;
            }
            this.contains = true;
        } else {
            this.contains = false;
        }
        p5.fill(color);




        /*p5.push();
        //noinspection JSCheckFunctionSignatures

        p5.translate(tx, ty);
        p5.rotate(ang);
        const anotherRotateX = off + tm/1.2;
        p5.translate(anotherRotateX, 0);
        const newAngle = this.angle < Math.PI ? -Math.PI/2.0 : Math.PI/2.0;
        //p5.rotate(newAngle);
        if (ang < 3 * Math.PI / 2 && ang > Math.PI / 2){
            p5.rotate(Math.PI);
        }
        const finalRotateX = -0.5;
        const finalRotateY = 7*scale;
        p5.translate(finalRotateX, finalRotateY);

        
        p5.text(l, 0, 0);
        p5.pop();*/

        p5.push();
        p5.translate(center.x, center.y);
        p5.rotate(ang);
        p5.translate(0, -radius);
        if (this.angle > Math.PI){
            p5.rotate(Math.PI);
        }
        p5.text(l, 0, 0);
        p5.pop();

        /*
        *This is for seeing where the boxes around anchors are
        p5.fill(100);
        anchorCorners.map(pt => p5.ellipse(pt[0], pt[1], 10, 10));
        p5.stroke(255);
        rectangleEdges.map(pair => p5.line(anchorCornersForContains[pair[0]].x, anchorCornersForContains[pair[0]].y, anchorCornersForContains[pair[1]].x, anchorCornersForContains[pair[1]].y));
        */


        // //we have the location wrt the rotated/translated set.
        // //want to convert these to the original coordinates
        // var x = 0;
        // var y = 0;
        //
        // x+= finalRotateX;
        // y+= finalRotateY;
        // x = x * Math.cos(newAngle) + y * Math.sin(newAngle);
        // y = -x * Math.sin(newAngle) + y * Math.cos(newAngle);
        //
        // x += anotherRotateX;
        //
        // x = x * Math.cos(this.angle) + y * Math.sin(this.angle);
        // y = -x * Math.sin(this.angle) + y * Math.cos(this.angle);
        //
        // x+= tx;
        // y+= ty;
        //
        // this.physLocation.x = x;
        // this.physLocation.y = y;

        // TODO: Make shape around AnchorDisplay text?
    },
    /**
     * Finds the corner point of an Anchor
     *
     * @param tx {number} Center X of Gear
     * @param ty {number} Center Y of Gear
     * @param tm {number} Minimum between tx and ty
     * @param off {number} offset
     * @returns {{x: number, y: number}}
     */
    findAnchorCorner : function(tx, ty, tm, off) {
        const rotation = this.getRotation(tx, ty, (off + tm/1.2), ty, this.angle);
        const newScale = (0.5*Math.min(tx, ty)/SunValues.R_OUTER);
        let x = rotation[0];
        let y = rotation[1];
        x += (x == tx ? 0 : (x > tx ? newScale : -newScale));
        y += (y == ty ? 0 : (y > ty ? newScale : -newScale));
        if (this.debug) {
            console.log(this.longDesc, " - x: ", x, ", y: ", y);
            this.debug = false;
        }
        return {
            x : x,
            y : y
        };
    },
    /**
     * This function takes in a center point, x-y point, and angle, then returns an array of the x-y point rotated on the center axis.
     *
     * @param cx {number} Center X
     * @param cy {number} Center Y
     * @param x {number} Point X
     * @param y {number} Point Y
     * @param angle {number} Rotation Angle
     * @returns {Array} New X and Y coordinates
     */
    getRotation : function(cx, cy, x, y, angle) {
        const radians = angle,
        cos = Math.cos(radians),
        sin = Math.sin(radians),
        nx = (cos * (x - cx)) + (sin * (y - cy)) + cx,
        returnY = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        let tempX = nx - cx;
        let returnX = cx - tempX;
        return [returnX, returnY];
    },
    /** @function contains was removed */
    /**
     * @param a {AnchorDisplay}
     * @returns {boolean}
     */
    compareTo : function(a) {
        return this.anchor.compareTo(a.anchor);
    },

    translateTransform : function(m,translationVector){
    return m.map(v => [v[0] + translationVector[0], v[1] + translationVector[1]]);
    },
    //hacky way because it was easier than importing library for dot product
    rotateTransform : function(m, ang, anchorVector){
        let firstTransVector = anchorVector.map(coor => -1 * coor);
        let shiftedM = this.translateTransform(m, firstTransVector);
        let rotatedM = shiftedM.map(pt => [pt[0] * Math.cos(ang) + pt[1] * Math.sin(ang), pt[1] * Math.cos(ang) - pt[0] * Math.sin(ang)]);
        let finalM = this.translateTransform(rotatedM, anchorVector);
        return finalM;
    },

    //it's cool cause it works
    polygonContainsQ: function(nvert, vertx, verty, testx, testy){
      let i, j, c = 0;
      for (i = 0, j = nvert-1; i < nvert; j = i++) {
        if ( ((verty[i]>testy) != (verty[j]>testy)) &&
         (testx < (vertx[j]-vertx[i]) * (testy-verty[i]) / (verty[j]-verty[i]) + vertx[i]) ){
           c = !c;
        }
      }
      return c;
    }
};

module.exports = AnchorDisplay;
