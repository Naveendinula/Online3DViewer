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
        // Map entityId -> { item, entityData, parentItem }
        this.entityItemMap = new Map();
    }

    GetName ()
    {
        return Loc ('Structure');
    }

    GetIcon ()
    {
        return 'tree_view';
    }
    
    Clear ()
    {
        super.Clear();
        this.entityItemMap.clear();
        this.selectedItem = null;
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
        
        // Store reference for building
        const buildingEntityData = { entityType: 'building', entityId: buildingStructure.id };
        this.entityItemMap.set(buildingStructure.id, { 
            item: rootItem, 
            entityData: buildingEntityData,
            parentItem: null 
        });
        
        // Add click handler for Building
        rootItem.OnClick((ev) => {
            // Toggle expansion is handled by TreeViewGroupItem, but we also want to select
            this.SetSelection(rootItem, buildingEntityData);
        });

        // Add Floors
        if (buildingStructure.floors) {
            for (const floor of buildingStructure.floors) {
                let floorItem = new TreeViewGroupItem (floor.name || Loc('Floor'), null);
                rootItem.AddChild (floorItem);
                
                // Store reference for floor
                const floorEntityData = { entityType: 'floor', entityId: floor.id };
                this.entityItemMap.set(floor.id, { 
                    item: floorItem, 
                    entityData: floorEntityData,
                    parentItem: rootItem 
                });
                
                // Add click handler for Floor
                floorItem.OnClick((ev) => {
                    this.SetSelection(floorItem, floorEntityData);
                });

                // Add Zones
                if (floor.zones) {
                    for (const zone of floor.zones) {
                        let zoneItem = new TreeViewSingleItem (zone.name || Loc('Zone'), null);
                        floorItem.AddChild (zoneItem);
                        
                        // Store reference for zone
                        const zoneEntityData = { entityType: 'zone', entityId: zone.id };
                        this.entityItemMap.set(zone.id, { 
                            item: zoneItem, 
                            entityData: zoneEntityData,
                            parentItem: floorItem 
                        });
                        
                        // Add click handler for Zone
                        zoneItem.OnClick(() => {
                            this.SetSelection(zoneItem, zoneEntityData);
                        });
                    }
                }
            }
        }
    }
    
    /**
     * Select an entity by its ID (called from external code, e.g., 3D click)
     * @param {Object} entity - { entityType, entityId }
     * @param {boolean} fireCallback - Whether to fire the onEntitySelected callback (default false to avoid loops)
     */
    SelectEntityById (entity, fireCallback = false)
    {
        if (!entity) {
            // Clear selection
            if (this.selectedItem) {
                if (this.selectedItem.SetSelected) {
                    this.selectedItem.SetSelected(false);
                } else {
                    this.selectedItem.mainElement.classList.remove('selected');
                }
                this.selectedItem = null;
            }
            return;
        }
        
        const entityId = typeof entity.entityId === 'string' ? parseInt(entity.entityId) : entity.entityId;
        const entry = this.entityItemMap.get(entityId);
        
        if (!entry) {
            console.warn('[NavigatorStructurePanel] Entity not found in tree:', entity);
            return;
        }
        
        // Expand parent items to make this node visible
        this.ExpandParents(entry);
        
        // Select the item
        if (fireCallback) {
            // Use SetSelection which fires callback
            this.SetSelection(entry.item, entry.entityData);
        } else {
            // Just update visual selection without firing callback
            this.SetSelectionVisual(entry.item);
        }
        
        // Scroll to make the item visible
        this.ScrollToItem(entry.item);
    }
    
    /**
     * Expand all parent items to make a node visible
     */
    ExpandParents (entry)
    {
        let parent = entry.parentItem;
        while (parent) {
            if (parent.ShowChildren) {
                parent.ShowChildren(true);
            }
            // Find parent's entry
            let parentEntry = null;
            for (const [id, e] of this.entityItemMap) {
                if (e.item === parent) {
                    parentEntry = e;
                    break;
                }
            }
            parent = parentEntry ? parentEntry.parentItem : null;
        }
    }
    
    /**
     * Scroll tree to make an item visible
     */
    ScrollToItem (item)
    {
        if (item && item.mainElement) {
            item.mainElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }
    
    /**
     * Set selection visual only (no callback)
     */
    SetSelectionVisual (item)
    {
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
    }

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
