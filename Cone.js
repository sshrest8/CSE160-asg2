class Cone {
    constructor(segments = 20, height = 1.0, radius = 0.5) {
        this.type = "cone";
        this.color = [1.0, 1.0, 1.0, 1.0];
        this.matrix = new Matrix4();
        this.segments = segments;
        this.height = height;
        this.radius = radius;
    }

    render() {
        let rgba = this.color;
        gl.uniform4f(u_FragColor, rgba[0], rgba[1], rgba[2], rgba[3]);
        gl.uniformMatrix4fv(u_ModelMatrix, false, this.matrix.elements);

        let baseCenter = [0.0, 0.0, 0.0];
        let tip = [0.0, this.height, 0.0];
        let angleStep = (2 * Math.PI) / this.segments;

        let basePoints = [];
        

        for (let i = 0; i <= this.segments; i++) {
            let angle = i * angleStep;
            let x = this.radius * Math.cos(angle);
            let z = this.radius * Math.sin(angle);
            basePoints.push([x, 0.0, z]);
        }


        for (let i = 0; i < this.segments; i++) {
            drawTriangle3D([
                baseCenter[0], baseCenter[1], baseCenter[2], 
                basePoints[i][0], basePoints[i][1], basePoints[i][2],
                basePoints[i + 1][0], basePoints[i + 1][1], basePoints[i + 1][2]
            ]);
        }

        for (let i = 0; i < this.segments; i++) {
            drawTriangle3D([
                tip[0], tip[1], tip[2], 
                basePoints[i + 1][0], basePoints[i + 1][1], basePoints[i + 1][2],
                basePoints[i][0], basePoints[i][1], basePoints[i][2]
            ]);
        }
    }
}
