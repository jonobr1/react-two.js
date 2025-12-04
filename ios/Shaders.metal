#include <metal_stdlib>
using namespace metal;

struct VertexIn {
    float2 position [[attribute(0)]];
    float4 color [[attribute(1)]];
};

struct VertexOut {
    float4 position [[position]];
    float4 color;
};

vertex VertexOut vertex_main(
    const device VertexIn* vertices [[buffer(0)]],
    uint vertexId [[vertex_id]],
    constant float2& viewportSize [[buffer(1)]]
) {
    VertexOut out;
    
    // Convert from pixel coordinates (0..width, 0..height) to NDC (-1..1, -1..1)
    float2 pixelSpacePosition = vertices[vertexId].position;
    float2 ndcPosition = float2(
        (pixelSpacePosition.x / viewportSize.x) * 2.0 - 1.0,
        -(pixelSpacePosition.y / viewportSize.y) * 2.0 + 1.0 // Flip Y for Metal
    );
    
    out.position = float4(ndcPosition, 0.0, 1.0);
    out.color = vertices[vertexId].color;
    
    return out;
}

fragment float4 fragment_main(VertexOut in [[stage_in]]) {
    return in.color;
}
