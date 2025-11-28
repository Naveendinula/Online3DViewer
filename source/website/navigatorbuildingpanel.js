import { NavigatorPanel } from './navigatorpanel.js';
import { TreeViewGroupItem, TreeViewButtonItem } from './treeview.js';
import { Loc } from '../engine/core/localization.js';
import { GetBoundingBox } from '../engine/model/modelutils.js';
import { Unit } from '../engine/model/unit.js';

export class NavigatorBuildingPanel extends NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
    }

    GetName ()
    {
        return Loc ('Building');
    }

    GetIcon ()
    {
        return 'model';
    }

    Fill (importResult)
    {
        this.Clear();
        let model = importResult.model;
        let rootItem = new TreeViewGroupItem (Loc ('Building Model'), null);
        this.treeView.AddChild (rootItem);
        rootItem.ShowChildren(true);

        let unit = model.GetUnit();
        let floorHeight = 3000.0; // Default mm
        if (unit === Unit.Meter) {
            floorHeight = 3.0;
        } else if (unit === Unit.Centimeter) {
            floorHeight = 300.0;
        } else if (unit === Unit.Foot) {
            floorHeight = 10.0;
        } else if (unit === Unit.Inch) {
            floorHeight = 120.0;
        }

        let levels = new Map(); // Level Index -> Array of MeshInstances

        model.EnumerateMeshInstances ((meshInstance) => {
            let bbox = GetBoundingBox (meshInstance);
            if (bbox === null) return;

            let center = bbox.GetCenter ();
            // Assuming Y is up.
            let levelIndex = Math.floor(center.y / floorHeight);

            if (!levels.has(levelIndex)) {
                levels.set(levelIndex, []);
            }
            levels.get(levelIndex).push(meshInstance);
        });

        // Sort levels ascending
        let sortedLevels = Array.from(levels.keys()).sort((a, b) => a - b);

        for (let levelIndex of sortedLevels) {
            let levelName = Loc ('Level') + ' ' + (levelIndex + 1);
            let levelItem = new TreeViewGroupItem (levelName, null);
            rootItem.AddChild (levelItem);

            let meshes = levels.get(levelIndex);
            for (let meshInstance of meshes) {
                let name = meshInstance.GetMesh().GetName();
                if (!name || name.length === 0) {
                    name = Loc ('Element');
                }
                let meshItem = new TreeViewButtonItem (name, null);
                meshItem.OnClick (() => {
                    this.callbacks.onMeshSelected (meshInstance.id);
                });
                levelItem.AddChild (meshItem);
            }
        }
    }
}
