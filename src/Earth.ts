/* Assignment 3: Earthquake Visualization Support Code
 * UMN CSci-4611 Instructors 2012+
 * GopherGfx implementation by Evan Suma Rosenberg <suma@umn.edu> 2022
 * License: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International
 * Please do not distribute beyond the CSci-4611 course
 */ 

import * as gfx from 'gophergfx'
import { EarthquakeMarker } from './EarthquakeMarker';
import { EarthquakeRecord } from './EarthquakeRecord';

export class Earth extends gfx.Node3
{
    private earthMesh: gfx.MorphMesh3;

    public globeMode: boolean;

    constructor()
    {
        // Call the superclass constructor
        super();

        this.earthMesh = new gfx.MorphMesh3();

        this.globeMode = false;
    }

    public createMesh() : void
    {
        // Initialize texture: you can change to a lower-res texture here if needed
        // Note that this won't display properly until you assign texture coordinates to the mesh
        this.earthMesh.material.texture = new gfx.Texture('./assets/earth-2k.png');
        
        // This disables mipmapping, which makes the texture appear sharper
        this.earthMesh.material.texture.setMinFilter(true, false);   

        // You can use this variable to define the resolution of your flat map and globe map
        // using a nested loop. 20x20 is reasonable for a good looking sphere, and you don't
        // need to change this constant to complete the base assignment.
        const meshResolution = 20;
        
        // Precalculated vertices and normals for the earth plane mesh.
        // After we compute them, we can store them directly in the earthMesh,
        // so they don't need to be member variables.
        const mapVertices: gfx.Vector3[] = [];
        const mapNormals: gfx.Vector3[] = [];

        // Part 1: Creating the Flat Map Mesh
        // To demo, we'll add a rectangle with two triangles.
        // This defines four vertices at each corner in latitude and longitude 
        // and converts to the coordinates used for the flat map.

        // Part 2: Texturing the Mesh
        // You should replace the example code below with texture coordinates for the earth mesh.
        const texCoords: number[] = [];
        
        for (let j = 0; j <= meshResolution; j++) {

            const b = j / meshResolution
            const yStart = 90;
            const yRange = 180;
            const y = yStart - (b * yRange);

            for(let i = 0; i <= meshResolution; i++) {

                const a = i / meshResolution;
                const xStart = -180;
                const xRange = 360;
                const x = xStart + (a * xRange);
                
                //verticies
                mapVertices.push(this.convertLatLongToPlane(y, x));

                // The flat map normals are always directly outward towards the camera
                mapNormals.push(gfx.Vector3.BACK);
                
                //textures
                texCoords.push(a, (b - 1));
            }
        }

        // Define indices into the array for the two triangles
        const indices: number[] = [];

        for(let row = 0; row < meshResolution; row++) {
            const curr_row = row * (meshResolution + 1);
            const row_below = (row + 1) * (meshResolution + 1);
            for(let col = 0; col < meshResolution; col++) {
                const offset = row * col  * 2;
                const curr_col = col;
                const next_col = col + 1;

                //need to make sure it doesnt connect last vertex to next rows verticies
                indices.push(curr_col + curr_row, curr_col + row_below, row_below + next_col);
                indices.push(row_below + next_col, curr_row + next_col, curr_col + curr_row);      
            }
        }

        // Set all the earth mesh data
        this.earthMesh.setVertices(mapVertices, true);
        this.earthMesh.setNormals(mapNormals, true);
        this.earthMesh.setIndices(indices);
        this.earthMesh.setTextureCoordinates(texCoords);

        // Part 3: Creating the Globe Mesh
        // You should compute a new set of vertices and normals
        // for the globe. You will need to also add code in
        // the convertLatLongToSphere() method below.

        const GlobeVertices: gfx.Vector3[] = [];
        const GlobeNormals: gfx.Vector3[] = [];

        for (let j = 0; j <= meshResolution; j++) {

            const b = j / meshResolution
            const yStart = 90;
            const yRange = 180;
            const y = yStart - (b * yRange);

            for(let i = 0; i <= meshResolution; i++) {

                const a = i / meshResolution;
                const xStart = -180;
                const xRange = 360;
                const x = xStart + (a * xRange);
                
                //verticies
                GlobeVertices.push(this.convertLatLongToSphere(y, x));

                // The flat map normals are always directly outward towards the camera
                GlobeNormals.push(gfx.Vector3.subtract(this.convertLatLongToSphere(y, x), new gfx.Vector3(0, 0, 0)));
            }
        }

        this.earthMesh.setMorphTargetVertices(GlobeVertices);
        this.earthMesh.setMorphTargetNormals(GlobeNormals);

        // Add the mesh to this group
        this.add(this.earthMesh);
    }

    public update(deltaTime: number) : void
    {
        // Part 4: Morphing Between the Map and Globe
        // The value of this.globeMode will be changed whenever
        // the user selects flat map or globe mode in the GUI.
        // You should use this boolean to control the morphing
        // of the earth mesh, as described in the readme.

        if(this.globeMode == false) {
                this.earthMesh.morphAlpha -= deltaTime;
                this.earthMesh.morphAlpha = gfx.MathUtils.clamp(this.earthMesh.morphAlpha, 0, 1);
                this.rotation.setIdentity();
        }
        else {
                this.earthMesh.morphAlpha += deltaTime;
                this.earthMesh.morphAlpha = gfx.MathUtils.clamp(this.earthMesh.morphAlpha, 0, 1);

                const angles = gfx.Quaternion.makeEulerAngles(0, deltaTime * 0.2, 0);
                this.rotation.premultiply(angles);

        }
    }

    public createEarthquake(record: EarthquakeRecord)
    {
        // Number of milliseconds in 1 year (approx.)
        const duration = 12 * 28 * 24 * 60 * 60;

        // Part 5: Creating the Earthquake Markers
        // Currently, the earthquakes are just placed randomly
        // on the plane. You will need to update this code to
        // correctly calculate both the map and globe positions of the markers.

        const mapPosition = this.convertLatLongToPlane(record.latitude, record.longitude);
        const globePosition = this.convertLatLongToSphere(record.latitude, record.longitude);


        const earthquake = new EarthquakeMarker(mapPosition, globePosition, record, duration);

        // Global adjustment to reduce the size. You should probably
        // update this be a more meaningful representation.

        //lerp variables
        const delt = record.magnitude;
        const min = 0;
        const max = 1.3;
        const alpha = (delt - min) / (max - min);
        
        //size lerp
        const size = gfx.MathUtils.lerp(min, max, record.normalizedMagnitude);
        earthquake.scale.set(size, size, size);

        //color lerp
        
        const color = gfx.Color.lerp(gfx.Color.YELLOW, gfx.Color.RED, record.normalizedMagnitude);
        earthquake.material.setColor(color);

        // Uncomment this line of code to active the earthquake markers
        this.add(earthquake);

        
    }

    public animateEarthquakes(currentTime : number)
    {
        // This code removes earthquake markers after their life has expired
        this.children.forEach((quake: gfx.Node3) => {
            if(quake instanceof EarthquakeMarker)
            {
                const playbackLife = (quake as EarthquakeMarker).getPlaybackLife(currentTime);

                // The earthquake has exceeded its lifespan and should be moved from the scene
                if(playbackLife >= 1)
                {
                    quake.remove();
                }
                // The earthquake positions should be updated
                else
                {
                    // Part 6: Morphing the Earthquake Positions
                    // If you have correctly computed the flat map and globe positions
                    // for each earthquake marker in part 5, then you can simply lerp
                    // between them using the same alpha as the earth mesh.
                    quake.position.lerp(quake.mapPosition, quake.globePosition, this.earthMesh.morphAlpha);
                }
            }
        });
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the flat map coordinate system described in the readme.
    public convertLatLongToPlane(latitude: number, longitude: number): gfx.Vector3
    {
        return new gfx.Vector3(longitude * Math.PI / 180, latitude * Math.PI / 180, 0);
    }

    // This convenience method converts from latitude and longitude (in degrees) to a Vector3 object
    // in the globe mesh map coordinate system described in the readme.
    public convertLatLongToSphere(latitude: number, longitude: number): gfx.Vector3
    {
        // Part 3: Creating the Globe Mesh
        // Add code here to correctly compute the 3D sphere position
        // based on latitude and longitude.

        const x = Math.cos((latitude * Math.PI / 180)) * Math.sin((longitude * Math.PI / 180));
        const y = Math.sin(latitude * Math.PI / 180);
        const z = Math.cos(latitude * Math.PI / 180) * Math.cos(longitude * Math.PI / 180);

        return new gfx.Vector3(x, y, z);
    }

    // This function toggles the wireframe debug mode on and off
    public toggleDebugMode(debugMode : boolean)
    {
        this.earthMesh.material.wireframe = debugMode;
    }
}