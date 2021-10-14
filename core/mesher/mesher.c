#include <math.h>
#include <stdbool.h>

typedef struct {
  const int width;
  const int height;
  const int depth;
} World;

static const unsigned char getAO(
  const bool n1,
  const bool n2,
  const bool n3
) {
  unsigned char ao = 0;
  if (n1) ao ++;
  if (n2) ao ++;
  if ((n1 && n2) || n3) ao++;
  return ao;
}

static const int getHeight(
  const World* world,
  const float* heightmap,
  const int x,
  const int z
) {
  if (
    x < 0 || x >= world->width
    || z < 0 || z >= world->depth
  ) {
    return 0;
  }
  return round(world->height * heightmap[z * world->width + x]);
}

static void growBox(
  unsigned char* box,
  const unsigned char x,
  const unsigned char y,
  const unsigned char z
) {
  if (box[0] > x) box[0] = x;
  if (box[1] > y) box[1] = y;
  if (box[2] > z) box[2] = z;
  if (box[3] < x) box[3] = x;
  if (box[4] < y) box[4] = y;
  if (box[5] < z) box[5] = z;
}

static void pushFace(
  unsigned char* box,
  unsigned int* faces,
  unsigned int* indices,
  unsigned char* vertices,
  const int chunkX, const int chunkY, const int chunkZ,
  const int wx1, const int wy1, const int wz1, const unsigned char ao1, const unsigned char c1,
  const int wx2, const int wy2, const int wz2, const unsigned char ao2, const unsigned char c2,
  const int wx3, const int wy3, const int wz3, const unsigned char ao3, const unsigned char c3,
  const int wx4, const int wy4, const int wz4, const unsigned char ao4, const unsigned char c4
) {
  const unsigned int  vertex = *faces * 4,
                      flipFace = (ao1 + ao3) > (ao2 + ao4) ? 1 : 0; // Fixes interpolation anisotropy
  unsigned int        indexOffset = *faces * 6,
                      vertexOffset = vertex * 4;
  const unsigned char x1 = wx1 - chunkX,
                      y1 = wy1 - chunkY,
                      z1 = wz1 - chunkZ,
                      x2 = wx2 - chunkX,
                      y2 = wy2 - chunkY,
                      z2 = wz2 - chunkZ,
                      x3 = wx3 - chunkX,
                      y3 = wy3 - chunkY,
                      z3 = wz3 - chunkZ,
                      x4 = wx4 - chunkX,
                      y4 = wy4 - chunkY,
                      z4 = wz4 - chunkZ;
  (*faces)++;
  vertices[vertexOffset++] = x1;
  vertices[vertexOffset++] = y1;
  vertices[vertexOffset++] = z1;
  vertices[vertexOffset++] = c1 << 4 | ao1;
  vertices[vertexOffset++] = x2;
  vertices[vertexOffset++] = y2;
  vertices[vertexOffset++] = z2;
  vertices[vertexOffset++] = c2 << 4 | ao2;
  vertices[vertexOffset++] = x3;
  vertices[vertexOffset++] = y3;
  vertices[vertexOffset++] = z3;
  vertices[vertexOffset++] = c3 << 4 | ao3;
  vertices[vertexOffset++] = x4;
  vertices[vertexOffset++] = y4;
  vertices[vertexOffset++] = z4;
  vertices[vertexOffset++] = c4 << 4 | ao4;
  indices[indexOffset++] = vertex + flipFace;
  indices[indexOffset++] = vertex + flipFace + 1;
  indices[indexOffset++] = vertex + flipFace + 2;
  indices[indexOffset++] = vertex + flipFace + 2;
  indices[indexOffset++] = vertex + ((flipFace + 3) % 4);
  indices[indexOffset++] = vertex + flipFace;
  growBox(box, x1, y1, z1);
  growBox(box, x2, y2, z2);
  growBox(box, x3, y3, z3);
  growBox(box, x4, y4, z4);
}

const int mesh(
  const World* world,
  const float* heightmap,
  float* bounds,
  unsigned int* indices,
  unsigned char* vertices,
  const unsigned char chunkHeight,
  const unsigned char chunkSize,
  const int chunkX,
  const int chunkY,
  const int chunkZ
) {
  if (
    chunkX < 0
    || chunkY < 0
    || chunkZ < 0
    || chunkX + chunkSize > world->width
    || chunkY > world->height
    || chunkZ + chunkSize > world->depth
  ) {
    return -1;
  }
  // WELCOME TO THE JUNGLE !!
  unsigned char box[6] = { chunkSize, chunkHeight, chunkSize, 0, 0, 0 };
  unsigned int faces = 0;
  for (int z = chunkZ; z < chunkZ + chunkSize; z++) {
    for (int x = chunkX; x < chunkX + chunkSize; x++) {
      const int height = getHeight(world, heightmap, x, z);
      if (height < chunkY) {
        continue;
      }
      const int south = getHeight(world, heightmap, x, z + 1),
                north = getHeight(world, heightmap, x, z - 1),
                southeast = getHeight(world, heightmap, x + 1, z + 1),
                southwest = getHeight(world, heightmap, x - 1, z + 1),
                northeast = getHeight(world, heightmap, x + 1, z - 1),
                northwest = getHeight(world, heightmap, x - 1, z - 1),
                east = getHeight(world, heightmap, x + 1, z),
                west = getHeight(world, heightmap, x - 1, z);
      int y = height;
      if (y > south) y = south;
      if (y > north) y = north;
      if (y > east) y = east;
      if (y > west) y = west;
      if (y < chunkY) y = chunkY;
      int top = chunkY + chunkHeight - 1;
      if (top > height) top = height;
      for (; y <= top; y++) {
        if (y == height) {
          pushFace(
            box,
            &faces,
            indices,
            vertices,
            chunkX, chunkY, chunkZ,
            x, y + 1, z + 1,
            getAO(west > y, south > y, southwest > y), 0,
            x + 1, y + 1, z + 1,
            getAO(east > y, south > y, southeast > y), 1,
            x + 1, y + 1, z,
            getAO(east > y, north > y, northeast > y), 2,
            x, y + 1, z,
            getAO(west > y, north > y, northwest > y), 3
          );
        }
        if (y > south) {
          pushFace(
            box,
            &faces,
            indices,
            vertices,
            chunkX, chunkY, chunkZ,
            x, y, z + 1,
            getAO(southwest >= y, south == y - 1, southwest >= y - 1), 0,
            x + 1, y, z + 1,
            getAO(southeast >= y, south == y - 1, southeast >= y - 1), 1,
            x + 1, y + 1, z + 1,
            getAO(southeast >= y, false, southeast >= y + 1), 1,
            x, y + 1, z + 1,
            getAO(southwest >= y, false, southwest >= y + 1), 0
          );
        }
        if (y > north) {
          pushFace(
            box,
            &faces,
            indices,
            vertices,
            chunkX, chunkY, chunkZ,
            x + 1, y, z,
            getAO(northeast >= y, north == y - 1, northeast >= y - 1), 2,
            x, y, z,
            getAO(northwest >= y, north == y - 1, northwest >= y - 1), 3,
            x, y + 1, z,
            getAO(northwest >= y, false, northwest >= y + 1), 3,
            x + 1, y + 1, z,
            getAO(northeast >= y, false, northeast >= y + 1), 2
          );
        }
        if (y > east) {
          pushFace(
            box,
            &faces,
            indices,
            vertices,
            chunkX, chunkY, chunkZ,
            x + 1, y, z + 1,
            getAO(southeast >= y, east == y - 1, southeast >= y - 1), 1,
            x + 1, y, z,
            getAO(northeast >= y, east == y - 1, northeast >= y - 1), 2,
            x + 1, y + 1, z,
            getAO(northeast >= y, false, northeast >= y + 1), 2,
            x + 1, y + 1, z + 1,
            getAO(southeast >= y, false, southeast >= y + 1), 1
          );
        }
        if (y > west) {
          pushFace(
            box,
            &faces,
            indices,
            vertices,
            chunkX, chunkY, chunkZ,
            x, y, z,
            getAO(northwest >= y, west == y - 1, northwest >= y - 1), 3,
            x, y, z + 1,
            getAO(southwest >= y, west == y - 1, southwest >= y - 1), 0,
            x, y + 1, z + 1,
            getAO(southwest >= y, false, southwest >= y + 1), 0,
            x, y + 1, z,
            getAO(northwest >= y, false, northwest >= y + 1), 3
          );
        }
      }
    }
  }

  const float halfWidth = 0.5f * (box[3] - box[0]),
              halfHeight = 0.5f * (box[4] - box[1]),
              halfDepth = 0.5f * (box[5] - box[2]);
  bounds[0] = 0.5f * (box[0] + box[3]);
  bounds[1] = 0.5f * (box[1] + box[4]);
  bounds[2] = 0.5f * (box[2] + box[5]);
  bounds[3] = sqrt(
    halfWidth * halfWidth
    + halfHeight * halfHeight
    + halfDepth * halfDepth
  );

  return faces;
}
