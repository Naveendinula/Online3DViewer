import { NavigatorPanel } from './navigatorpanel.js';
import { TreeViewGroupItem, TreeViewSingleItem } from './treeview.js';
import { Loc } from '../engine/core/localization.js';
import { getBuildingStructure } from './building_structure_model.js';

export class NavigatorStructurePanel extends NavigatorPanel
{
    constructor (parentDiv)
    {
        super (parentDiv);
        this.selectedItem = null;
    }

    GetName ()
    {
        return Loc ('Structure');
    }

    GetIcon ()
    {
        return 'tree_view';
    }

    Fill (importResult)
    {
        this.Clear();
        
        // Get data from the model
        const buildingStructure = getBuildingStructure();
        
        if (!buildingStructure) {
            // If no structure data, maybe show a message or leave empty
            return;
        }

        // Create Root Item (Building)
        let rootItem = new TreeViewGroupItem (buildingStructure.name || Loc('Building'), null);
        this.treeView.AddChild (rootItem);
        rootItem.ShowChildren(true);
        
        // Add click handler for Building
        rootItem.OnClick((ev) => {
            // Toggle expansion is handled by TreeViewGroupItem, but we also want to select
            this.SetSelection(rootItem, { entityType: 'building', entityId: buildingStructure.id });
        });

        // Add Floors
        if (buildingStructure.floors) {
            for (const floor of buildingStructure.floors) {
                let floorItem = new TreeViewGroupItem (floor.name || Loc('Floor'), null);
                rootItem.AddChild (floorItem);
                
                // Add click handler for Floor
                floorItem.OnClick((ev) => {
                    this.SetSelection(floorItem, { entityType: 'floor', entityId: floor.id });
                });

                // Add Zones
                if (floor.zones) {
                    for (const zone of floor.zones) {
                        let zoneItem = new TreeViewSingleItem (zone.name || Loc('Zone'), null);
                        floorItem.AddChild (zoneItem);
                        
                        // Add click handler for Zone
                        zoneItem.OnClick(() => {
                            this.SetSelection(zoneItem, { entityType: 'zone', entityId: zone.id });
                        });
                    }
                }
            }
        }
    }

    SetSelection(item, entityData) {
        if (this.selectedItem) {
            this.selectedItem.SetSelected(false);
        }
        
        this.selectedItem = item;
        
        // TreeViewGroupItem doesn't have SetSelected in the base code I read, 
        // but TreeViewSingleItem does. 
        // If TreeViewGroupItem inherits from TreeViewItem but not TreeViewSingleItem, 
        // we might need to handle highlighting manually or check if TreeViewGroupItem supports it.
        // Looking at treeview.js: TreeViewGroupItem extends TreeViewItem. TreeViewSingleItem extends TreeViewItem.
        // TreeViewSingleItem has SetSelected. TreeViewGroupItem does NOT.
        // However, for this task, "Indicate which item is currently selected (simple highlight)" is required.
        // I will check if I can add a simple class or if I should modify TreeViewGroupItem.
        // For now, I'll try to use the same class manipulation as TreeViewSingleItem.
        
        if (item.SetSelected) {
            item.SetSelected(true);
        } else {
            // Manual highlight for Group Items if they don't support SetSelected
            if (this.selectedItem.mainElement) {
                // Remove 'selected' from all items first? 
                // The previous selectedItem.SetSelected(false) handles the previous one if it was a SingleItem.
                // If it was a GroupItem, we need to remove the class manually.
                // To be safe, I should probably implement a helper or extend the class, 
                // but for now I will just toggle the class.
                
                // Note: In the previous step I cleared selection on `this.selectedItem`.
                // If `this.selectedItem` was a GroupItem, I need to handle that unselect too.
            }
            
            item.mainElement.classList.add('selected');
        }

        // Fire callback
        if (this.callbacks && this.callbacks.onEntitySelected) {
            this.callbacks.onEntitySelected(entityData);
        }
    }
    
    // Override SetSelection to handle the manual group item selection logic better
    SetSelection(item, entityData) {
        // Deselect previous
        if (this.selectedItem) {
            if (this.selectedItem.SetSelected) {
                this.selectedItem.SetSelected(false);
            } else {
                this.selectedItem.mainElement.classList.remove('selected');
            }
        }

        this.selectedItem = item;

        // Select new
        if (this.selectedItem) {
            if (this.selectedItem.SetSelected) {
                this.selectedItem.SetSelected(true);
            } else {
                this.selectedItem.mainElement.classList.add('selected');
            }
        }

        // Fire callback
        if (this.callbacks && this.callbacks.onEntitySelected) {
            this.callbacks.onEntitySelected(entityData);
        }
    }
}
