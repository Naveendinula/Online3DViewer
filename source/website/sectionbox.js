import * as THREE from 'three';

export class SectionBox
{
    constructor (viewer)
    {
        this.viewer = viewer;
        this.isEnabled = false;
        this.box = new THREE.Box3 ();
        this.planes = [];
        this.boxHelper = null;
        
        this.InitPlanes ();
    }

    InitPlanes ()
    {
        for (let i = 0; i < 6; i++) {
            this.planes.push (new THREE.Plane ());
        }
    }

    IsEnabled ()
    {
        return this.isEnabled;
    }

    Enable (isEnabled)
    {
        this.isEnabled = isEnabled;
        let renderer = this.viewer.renderer;
        if (this.isEnabled) {
            renderer.localClippingEnabled = true;
            renderer.clippingPlanes = this.planes;
            
            if (this.boxHelper === null) {
                this.boxHelper = new THREE.Box3Helper (this.box, 0xff0000);
                this.viewer.AddExtraObject (this.boxHelper);
            }
            this.boxHelper.visible = true;
            this.UpdatePlanes ();
        } else {
            renderer.clippingPlanes = [];
            if (this.boxHelper !== null) {
                this.boxHelper.visible = false;
            }
        }
        this.viewer.Render ();
    }

    SetBox (box)
    {
        this.box.copy (box);
        if (this.boxHelper !== null) {
            this.boxHelper.box.copy (this.box);
        }
        this.UpdatePlanes ();
        this.viewer.Render ();
    }

    UpdatePlanes ()
    {
        if (!this.isEnabled) {
            return;
        }

        const min = this.box.min;
        const max = this.box.max;

        this.planes[0].setComponents ( 1,  0,  0, -min.x);
        this.planes[1].setComponents (-1,  0,  0,  max.x);
        this.planes[2].setComponents ( 0,  1,  0, -min.y);
        this.planes[3].setComponents ( 0, -1,  0,  max.y);
        this.planes[4].setComponents ( 0,  0,  1, -min.z);
        this.planes[5].setComponents ( 0,  0, -1,  max.z);
    }
}
