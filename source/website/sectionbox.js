import * as THREE from 'three';

/**
 * SectionBox - Revit-style interactive section box for 3D clipping
 * 
 * Features:
 * - Axis-aligned clipping box with 6 planes
 * - Interactive face handles for dragging
 * - Real-time geometry clipping
 * - Selection Box command (fit to selected objects)
 */
export class SectionBox
{
    constructor (viewer)
    {
        this.viewer = viewer;
        
        // Data model
        this.enabled = false;
        this.bounds = {
            minX: 0, maxX: 1,
            minY: 0, maxY: 1,
            minZ: 0, maxZ: 1
        };
        
        // THREE.js objects
        this.box = new THREE.Box3 ();
        this.planes = [];
        this.edgesHelper = null;
        this.faceHandles = [];
        
        // Separate scene for section box visuals (not affected by clipping)
        this.overlayScene = new THREE.Scene ();
        
        // Interaction state
        this.activeFace = null;
        this.isDragging = false;
        this.dragStartPoint = null;
        this.dragPlane = null;
        this.dragStartBound = null;
        
        // Visual settings
        this.edgeColor = 0x0088cc;
        this.handleColor = 0x0088ff;
        this.handleHoverColor = 0xffaa00;
        this.handleActiveColor = 0xff5500;
        this.handleSize = 0.06;
        
        // Raycaster for picking
        this.raycaster = new THREE.Raycaster ();
        
        // Store original render function
        this.originalRender = null;
        
        this.InitPlanes ();
    }

    // ==================== Data Model API ====================
    
    /**
     * Get the current section box bounds
     * @returns {Object} { enabled, minX, maxX, minY, maxY, minZ, maxZ }
     */
    GetSectionBox ()
    {
        return {
            enabled: this.enabled,
            minX: this.bounds.minX,
            maxX: this.bounds.maxX,
            minY: this.bounds.minY,
            maxY: this.bounds.maxY,
            minZ: this.bounds.minZ,
            maxZ: this.bounds.maxZ
        };
    }
    
    /**
     * Set the section box bounds
     * @param {Object} bounds - { minX, maxX, minY, maxY, minZ, maxZ }
     */
    SetSectionBox (bounds)
    {
        this.bounds.minX = bounds.minX;
        this.bounds.maxX = bounds.maxX;
        this.bounds.minY = bounds.minY;
        this.bounds.maxY = bounds.maxY;
        this.bounds.minZ = bounds.minZ;
        this.bounds.maxZ = bounds.maxZ;
        
        this.SyncBoxFromBounds ();
        this.UpdateVisuals ();
        this.UpdatePlanes ();
        this.viewer.Render ();
    }
    
    /**
     * Enable or disable the section box
     * @param {boolean} enabled 
     */
    EnableSectionBox (enabled)
    {
        this.enabled = enabled;
        this.Enable (enabled);
    }
    
    /**
     * Fit the section box to a bounding box with optional margin
     * @param {THREE.Box3} boundingBox - Bounding box to fit to
     * @param {number} marginFactor - Expansion factor (e.g., 0.1 for 10% margin)
     */
    FitToBox (boundingBox, marginFactor = 0.05)
    {
        if (!boundingBox || boundingBox.isEmpty ()) {
            return;
        }
        
        const size = new THREE.Vector3 ();
        boundingBox.getSize (size);
        
        const margin = new THREE.Vector3 (
            size.x * marginFactor,
            size.y * marginFactor,
            size.z * marginFactor
        );
        
        this.bounds.minX = boundingBox.min.x - margin.x;
        this.bounds.maxX = boundingBox.max.x + margin.x;
        this.bounds.minY = boundingBox.min.y - margin.y;
        this.bounds.maxY = boundingBox.max.y + margin.y;
        this.bounds.minZ = boundingBox.min.z - margin.z;
        this.bounds.maxZ = boundingBox.max.z + margin.z;
        
        this.SyncBoxFromBounds ();
        this.UpdateVisuals ();
        this.UpdatePlanes ();
        this.viewer.Render ();
    }
    
    // ==================== Legacy API (compatibility) ====================
    
    IsEnabled ()
    {
        return this.enabled;
    }

    Enable (isEnabled)
    {
        this.enabled = isEnabled;
        let renderer = this.viewer.renderer;
        
        if (this.enabled) {
            renderer.localClippingEnabled = true;
            renderer.clippingPlanes = this.planes;
            
            this.CreateVisuals ();
            this.ShowVisuals (true);
            this.UpdatePlanes ();
            this.HookRender ();
        } else {
            renderer.clippingPlanes = [];
            this.ShowVisuals (false);
            this.isDragging = false;
            this.activeFace = null;
            this.UnhookRender ();
        }
        this.viewer.Render ();
    }
    
    HookRender ()
    {
        if (this.originalRender !== null) {
            return; // Already hooked
        }
        
        // Store and wrap the viewer's render function
        this.originalRender = this.viewer.Render.bind (this.viewer);
        const self = this;
        
        this.viewer.Render = function () {
            // Call original render (with clipping)
            self.originalRender ();
            
            // Render overlay scene without clipping
            if (self.enabled && self.overlayScene.children.length > 0) {
                const renderer = self.viewer.renderer;
                const savedClippingPlanes = renderer.clippingPlanes;
                
                renderer.clippingPlanes = [];
                renderer.autoClear = false;
                renderer.render (self.overlayScene, self.viewer.camera);
                renderer.autoClear = true;
                
                renderer.clippingPlanes = savedClippingPlanes;
            }
        };
    }
    
    UnhookRender ()
    {
        if (this.originalRender !== null) {
            this.viewer.Render = this.originalRender;
            this.originalRender = null;
        }
    }

    SetBox (box)
    {
        if (!box || box.isEmpty ()) {
            return;
        }
        
        this.box.copy (box);
        this.SyncBoundsFromBox ();
        this.UpdateVisuals ();
        this.UpdatePlanes ();
        this.viewer.Render ();
    }
    
    // ==================== Internal Methods ====================
    
    InitPlanes ()
    {
        for (let i = 0; i < 6; i++) {
            this.planes.push (new THREE.Plane ());
        }
    }
    
    SyncBoxFromBounds ()
    {
        this.box.min.set (this.bounds.minX, this.bounds.minY, this.bounds.minZ);
        this.box.max.set (this.bounds.maxX, this.bounds.maxY, this.bounds.maxZ);
    }
    
    SyncBoundsFromBox ()
    {
        this.bounds.minX = this.box.min.x;
        this.bounds.maxX = this.box.max.x;
        this.bounds.minY = this.box.min.y;
        this.bounds.maxY = this.box.max.y;
        this.bounds.minZ = this.box.min.z;
        this.bounds.maxZ = this.box.max.z;
    }

    UpdatePlanes ()
    {
        if (!this.enabled) {
            return;
        }

        const min = this.box.min;
        const max = this.box.max;

        // Plane equation: normal.x * x + normal.y * y + normal.z * z + constant = 0
        // For clipping, points are visible where dot(normal, point) + constant >= 0
        this.planes[0].setComponents ( 1,  0,  0, -min.x);  // +X face clips at minX
        this.planes[1].setComponents (-1,  0,  0,  max.x);  // -X face clips at maxX
        this.planes[2].setComponents ( 0,  1,  0, -min.y);  // +Y face clips at minY
        this.planes[3].setComponents ( 0, -1,  0,  max.y);  // -Y face clips at maxY
        this.planes[4].setComponents ( 0,  0,  1, -min.z);  // +Z face clips at minZ
        this.planes[5].setComponents ( 0,  0, -1,  max.z);  // -Z face clips at maxZ
    }
    
    // ==================== Visual Representation ====================
    
    CreateVisuals ()
    {
        if (this.edgesHelper !== null) {
            return; // Already created
        }
        
        // Create wireframe box edges
        const boxGeometry = new THREE.BoxGeometry (1, 1, 1);
        const edgesGeometry = new THREE.EdgesGeometry (boxGeometry);
        const edgesMaterial = new THREE.LineBasicMaterial ({ 
            color: this.edgeColor,
            linewidth: 2,
            depthTest: true,
            depthWrite: false
        });
        
        this.edgesHelper = new THREE.LineSegments (edgesGeometry, edgesMaterial);
        this.edgesHelper.name = 'SectionBoxEdges';
        this.overlayScene.add (this.edgesHelper);
        
        boxGeometry.dispose (); // No longer needed
        
        // Create 6 face handles
        this.CreateFaceHandles ();
        
        this.UpdateVisuals ();
    }
    
    CreateFaceHandles ()
    {
        // Face definitions: name, normal direction, position offset axis
        const faces = [
            { name: 'minX', normal: new THREE.Vector3 (-1, 0, 0), axis: 'x', side: 'min' },
            { name: 'maxX', normal: new THREE.Vector3 ( 1, 0, 0), axis: 'x', side: 'max' },
            { name: 'minY', normal: new THREE.Vector3 (0, -1, 0), axis: 'y', side: 'min' },
            { name: 'maxY', normal: new THREE.Vector3 (0,  1, 0), axis: 'y', side: 'max' },
            { name: 'minZ', normal: new THREE.Vector3 (0, 0, -1), axis: 'z', side: 'min' },
            { name: 'maxZ', normal: new THREE.Vector3 (0, 0,  1), axis: 'z', side: 'max' }
        ];
        
        for (const face of faces) {
            const handleGeometry = new THREE.SphereGeometry (1, 16, 12);
            const handleMaterial = new THREE.MeshBasicMaterial ({
                color: this.handleColor,
                depthTest: true,
                depthWrite: true
            });
            
            const handle = new THREE.Mesh (handleGeometry, handleMaterial);
            handle.name = 'Handle_' + face.name;
            handle.userData = {
                faceName: face.name,
                normal: face.normal.clone (),
                axis: face.axis,
                side: face.side
            };
            
            this.faceHandles.push (handle);
            this.overlayScene.add (handle);
        }
    }
    
    UpdateVisuals ()
    {
        if (this.overlayScene === null) {
            return;
        }
        
        const center = new THREE.Vector3 ();
        const size = new THREE.Vector3 ();
        this.box.getCenter (center);
        this.box.getSize (size);
        
        // Ensure minimum size to avoid zero-scale issues
        if (size.x < 0.001) size.x = 0.001;
        if (size.y < 0.001) size.y = 0.001;
        if (size.z < 0.001) size.z = 0.001;
        
        // Update edges (main visual)
        if (this.edgesHelper) {
            this.edgesHelper.position.copy (center);
            this.edgesHelper.scale.copy (size);
        }
        
        // Update face handles
        const handleRadius = Math.min (size.x, size.y, size.z) * this.handleSize;
        const minHandleRadius = 0.1; // Minimum visible size
        const actualRadius = Math.max (handleRadius, minHandleRadius);
        
        for (const handle of this.faceHandles) {
            const data = handle.userData;
            const pos = center.clone ();
            
            // Position handle at center of each face
            if (data.side === 'min') {
                pos[data.axis] = this.box.min[data.axis];
            } else {
                pos[data.axis] = this.box.max[data.axis];
            }
            
            handle.position.copy (pos);
            handle.scale.setScalar (actualRadius);
        }
    }
    
    ShowVisuals (visible)
    {
        // Show/hide all objects in the overlay scene
        this.overlayScene.traverse ((obj) => {
            obj.visible = visible;
        });
    }
    
    // ==================== Mouse Interaction ====================
    
    /**
     * Handle mouse down - check if clicking on a handle
     * @param {Object} mouseCoords - Normalized device coordinates { x, y } (-1 to 1)
     * @param {number} button - Mouse button (1 = left, 2 = middle, 3 = right)
     * @returns {boolean} True if interaction was handled
     */
    OnMouseDown (mouseCoords, button)
    {
        if (!this.enabled || this.faceHandles.length === 0 || button !== 1) {
            return false;
        }
        
        const camera = this.viewer.camera;
        const ndc = new THREE.Vector2 (mouseCoords.x, mouseCoords.y);
        this.raycaster.setFromCamera (ndc, camera);
        
        // Check intersection with handles
        const intersects = this.raycaster.intersectObjects (this.faceHandles, false);
        
        if (intersects.length > 0) {
            const handle = intersects[0].object;
            this.StartDrag (handle, intersects[0].point);
            return true;
        }
        
        return false;
    }
    
    /**
     * Handle mouse move - update drag if active
     * @param {Object} mouseCoords - Normalized device coordinates { x, y }
     * @returns {boolean} True if interaction was handled
     */
    OnMouseMove (mouseCoords)
    {
        if (!this.enabled || this.faceHandles.length === 0) {
            return false;
        }
        
        const ndc = new THREE.Vector2 (mouseCoords.x, mouseCoords.y);
        
        if (this.isDragging) {
            this.UpdateDrag (ndc);
            return true;
        }
        
        // Hover highlight
        const camera = this.viewer.camera;
        this.raycaster.setFromCamera (ndc, camera);
        
        const intersects = this.raycaster.intersectObjects (this.faceHandles, false);
        
        // Reset all handles to default color
        for (const handle of this.faceHandles) {
            handle.material.color.setHex (this.handleColor);
        }
        
        // Highlight hovered handle
        if (intersects.length > 0) {
            intersects[0].object.material.color.setHex (this.handleHoverColor);
            this.viewer.Render ();
            return false; // Don't consume the event, just update visuals
        }
        
        this.viewer.Render ();
        return false;
    }
    
    /**
     * Handle mouse up - end drag
     * @returns {boolean} True if interaction was handled
     */
    OnMouseUp ()
    {
        if (this.isDragging) {
            this.EndDrag ();
            return true;
        }
        return false;
    }
    
    StartDrag (handle, hitPoint)
    {
        this.isDragging = true;
        this.activeFace = handle.userData.faceName;
        this.dragStartPoint = hitPoint.clone ();
        
        // Create a drag plane perpendicular to the camera view but containing the face normal
        // This allows intuitive dragging regardless of camera angle
        const camera = this.viewer.camera;
        const cameraDir = new THREE.Vector3 ();
        camera.getWorldDirection (cameraDir);
        
        // Create plane that contains the hit point and is oriented for dragging along face normal
        // Use a plane perpendicular to the camera direction for intuitive dragging
        this.dragPlane = new THREE.Plane ();
        this.dragPlane.setFromNormalAndCoplanarPoint (
            cameraDir.clone ().negate (),
            hitPoint
        );
        
        // Store the initial bound value
        this.dragStartBound = this.bounds[this.activeFace];
        
        // Highlight active handle
        handle.material.color.setHex (this.handleActiveColor);
        
        this.viewer.Render ();
    }
    
    UpdateDrag (mouseCoords)
    {
        if (!this.isDragging || !this.activeFace) {
            return;
        }
        
        const camera = this.viewer.camera;
        this.raycaster.setFromCamera (mouseCoords, camera);
        
        // Find intersection with drag plane
        const intersection = new THREE.Vector3 ();
        if (!this.raycaster.ray.intersectPlane (this.dragPlane, intersection)) {
            return;
        }
        
        // Calculate movement along the face normal axis
        const handle = this.faceHandles.find (h => h.userData.faceName === this.activeFace);
        if (!handle) return;
        
        const axis = handle.userData.axis;
        const delta = intersection[axis] - this.dragStartPoint[axis];
        
        // Update the bound
        let newValue = this.dragStartBound + delta;
        
        // Enforce constraints: min must be less than max
        const oppositeKey = handle.userData.side === 'min' 
            ? 'max' + axis.toUpperCase ()
            : 'min' + axis.toUpperCase ();
        
        if (handle.userData.side === 'min') {
            // minX/Y/Z must be less than maxX/Y/Z
            newValue = Math.min (newValue, this.bounds[oppositeKey] - 0.01);
        } else {
            // maxX/Y/Z must be greater than minX/Y/Z
            newValue = Math.max (newValue, this.bounds[oppositeKey] + 0.01);
        }
        
        this.bounds[this.activeFace] = newValue;
        
        // Update everything
        this.SyncBoxFromBounds ();
        this.UpdateVisuals ();
        this.UpdatePlanes ();
        this.viewer.Render ();
    }
    
    EndDrag ()
    {
        if (this.activeFace) {
            // Reset handle color
            const handle = this.faceHandles.find (h => h.userData.faceName === this.activeFace);
            if (handle) {
                handle.material.color.setHex (this.handleColor);
            }
        }
        
        this.isDragging = false;
        this.activeFace = null;
        this.dragStartPoint = null;
        this.dragPlane = null;
        this.dragStartBound = null;
        
        this.viewer.Render ();
    }
    
    /**
     * Convert screen coordinates to normalized device coordinates
     * @param {Object} screenCoords - { x, y } in pixels
     * @param {Object} canvasSize - { width, height } in pixels
     * @returns {THREE.Vector2} Normalized coordinates (-1 to 1)
     */
    ScreenToNDC (screenCoords, canvasSize)
    {
        return new THREE.Vector2 (
            (screenCoords.x / canvasSize.width) * 2 - 1,
            -(screenCoords.y / canvasSize.height) * 2 + 1
        );
    }
    
    // ==================== Cleanup ====================
    
    Dispose ()
    {
        // Unhook render if still hooked
        this.UnhookRender ();
        
        // Dispose all objects in overlay scene
        if (this.edgesHelper) {
            this.edgesHelper.geometry.dispose ();
            this.edgesHelper.material.dispose ();
            this.overlayScene.remove (this.edgesHelper);
            this.edgesHelper = null;
        }
        
        for (const handle of this.faceHandles) {
            handle.geometry.dispose ();
            handle.material.dispose ();
            this.overlayScene.remove (handle);
        }
        this.faceHandles = [];
    }
}
