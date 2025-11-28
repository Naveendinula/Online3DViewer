export class AnalyticsService
{
    static GetBuildingStats (model)
    {
        // Mock data generation
        // We could use model statistics (vertex count, mesh count) to vary the numbers slightly
        let meshCount = model.MeshInstanceCount();

        return {
            eui: (40 + (meshCount % 20)).toFixed(1),
            carbon: (1000 + (meshCount * 5)).toLocaleString(),
            occupancy: 80 + (meshCount % 15),
            capacity: 1000 + (meshCount * 10),
            energyChart: [10, 15, 12, 20, 25, 18, 15],
            tempChart: [20, 21, 22, 21, 20, 19, 20]
        };
    }
}
