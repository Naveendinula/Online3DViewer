/**
 * Viewer Selection Utilities
 * 
 * Helper functions for highlighting and framing geometry in the 3D viewer
 * based on Building Structure entity selections.
 */

import { RGBColor } from '../engine/model/color.js';

/**
 * Structure highlight color - a distinct color from regular mesh selection
 */
export const StructureHighlightColor = new RGBColor (255, 180, 100); // Orange tint

/**
 * Highlights geometry meshes by their expressIDs
 * @param {Viewer} viewer - The 3D viewer instance
 * @param {RGBColor} highlightColor - Color to use for highlighting
 * @param {Set<number>} expressIds - Set of expressIDs to highlight
 */
export function highlightGeometryByExpressIds (viewer, highlightColor, expressIds)
{
    viewer.SetMeshesHighlight (highlightColor, (meshUserData) => {
        // Extract expressID from mesh name "Mesh {expressID}"
        const meshInstance = meshUserData.originalMeshInstance;
        if (!meshInstance) return false;
        
        const mesh = meshInstance.GetMesh ();
        const name = mesh.GetName ();
        const match = name && name.match (/^Mesh (\d+)$/);
        
        if (match) {
            const expressID = parseInt (match[1]);
            return expressIds.has (expressID);
        }
        return false;
    });
}

/**
 * Clears all geometry highlighting
 * @param {Viewer} viewer - The 3D viewer instance
 */
export function clearGeometryHighlight (viewer)
{
    viewer.SetMeshesHighlight (new RGBColor (0, 0, 0), () => false);
}

/**
 * Frames the camera on geometry meshes by their expressIDs
 * @param {Viewer} viewer - The 3D viewer instance
 * @param {Set<number>} expressIds - Set of expressIDs to frame
 * @param {boolean} animate - Whether to animate the camera movement
 */
export function frameCameraOnExpressIds (viewer, expressIds, animate = true)
{
    const boundingSphere = viewer.GetBoundingSphere ((meshUserData) => {
        const meshInstance = meshUserData.originalMeshInstance;
        if (!meshInstance) return false;
        
        const mesh = meshInstance.GetMesh ();
        const name = mesh.GetName ();
        const match = name && name.match (/^Mesh (\d+)$/);
        
        if (match) {
            const expressID = parseInt (match[1]);
            return expressIds.has (expressID);
        }
        return false;
    });
    
    if (boundingSphere !== null) {
        viewer.FitSphereToWindow (boundingSphere, animate);
    }
}

/**
 * Frames the camera on the entire model
 * @param {Viewer} viewer - The 3D viewer instance
 * @param {boolean} animate - Whether to animate the camera movement
 */
export function frameCameraOnModel (viewer, animate = true)
{
    const boundingSphere = viewer.GetBoundingSphere (() => true);
    if (boundingSphere !== null) {
        viewer.FitSphereToWindow (boundingSphere, animate);
    }
}

/**
 * Gets all expressIDs from the model (for highlighting entire building)
 * @param {Viewer} viewer - The 3D viewer instance
 * @returns {Set<number>} Set of all expressIDs
 */
export function getAllExpressIds (viewer)
{
    const expressIds = new Set ();
    
    viewer.EnumerateMeshesAndLinesUserData ((meshUserData) => {
        const meshInstance = meshUserData.originalMeshInstance;
        if (!meshInstance) return;
        
        const mesh = meshInstance.GetMesh ();
        const name = mesh.GetName ();
        const match = name && name.match (/^Mesh (\d+)$/);
        
        if (match) {
            expressIds.add (parseInt (match[1]));
        }
    });
    
    return expressIds;
}
