import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { SeatStatus } from "@tickethub/shared";
import { VENUE_SVG } from "../src/lib/venue-svg.generated.ts";
import {
  calculateMinimapViewport,
  minimapClickToPan,
  parseViewBox,
} from "../src/components/events/seat-map.utils.ts";

describe("SeatMap & Minimap: UC04 Architectural Map & Navigation", () => {
  test("SeatStatus enum tu shared package dung quy chuan", () => {
    assert.equal(SeatStatus.AVAILABLE, "AVAILABLE");
    assert.equal(SeatStatus.HELD, "HELD");
    assert.equal(SeatStatus.SOLD, "SOLD");
    assert.equal(SeatStatus.BLOCKED, "BLOCKED");
  });

  test("VENUE_SVG chua cac ban do khan dai hop le va parse duoc viewBox", () => {
    const venueKeys = Object.keys(VENUE_SVG);
    assert.ok(venueKeys.length >= 4, "Phai co it nhat 4 loai ban do san van dong / nha hat");
    assert.ok(venueKeys.includes("arena-t-stage"), "Phai co ban do arena-t-stage");
    assert.ok(venueKeys.includes("stadium-football"), "Phai co ban do stadium-football");

    for (const key of venueKeys) {
      const map = VENUE_SVG[key];
      assert.ok(map, `Ban do ${key} phai ton tai`);
      assert.ok(map.viewBox, `Ban do ${key} phai co viewBox`);
      assert.ok(map.markup.length > 50, `Ban do ${key} phai co markup SVG`);

      // Su dung parseViewBox thuc te tu seat-map.utils
      const parsed = parseViewBox(map.viewBox);
      assert.ok(parsed.width > 0, `viewBox width cua ${key} phai > 0`);
      assert.ok(parsed.height > 0, `viewBox height cua ${key} phai > 0`);
      assert.ok(map.markup.includes("data-zone"), `Markup ${key} phai chua it nhat 1 khu vuc data-zone`);
    }
  });

  test("calculateMinimapViewport tinh toan scale va clamping chinh xac", () => {
    const mapWidth = 120;
    const mapHeight = 90;
    const containerWidth = 800;
    const containerHeight = 600;

    // Truong hop 1: Zoom = 1 (toan canh mac dinh), pan = (0, 0)
    const vp1 = calculateMinimapViewport({
      zoom: 1,
      pan: { x: 0, y: 0 },
      mapWidth,
      mapHeight,
      containerWidth,
      containerHeight,
    });
    assert.equal(vp1.scaleRatio, 1);
    assert.equal(vp1.rectWidth, 120);
    assert.equal(vp1.rectHeight, 90);
    assert.equal(vp1.rectX, 0);
    assert.equal(vp1.rectY, 0);

    // Truong hop 2: Zoom = 2 (phong to 2x)
    const vp2 = calculateMinimapViewport({
      zoom: 2,
      pan: { x: 0, y: 0 },
      mapWidth,
      mapHeight,
      containerWidth,
      containerHeight,
    });
    assert.equal(vp2.scaleRatio, 0.5);
    assert.equal(vp2.rectWidth, 60);
    assert.equal(vp2.rectHeight, 45);
    assert.equal(vp2.rectX, 30); // Căn giữa
    assert.equal(vp2.rectY, 22.5);

    // Truong hop 3: Pan cuc dai sang trai / tren -> clamping khong bi am
    const vpLeft = calculateMinimapViewport({
      zoom: 2,
      pan: { x: -99999, y: -99999 },
      mapWidth,
      mapHeight,
      containerWidth,
      containerHeight,
    });
    assert.ok(vpLeft.rectX >= 0, "rectX phai >= 0 khi pan am lon");
    assert.ok(vpLeft.rectY >= 0, "rectY phai >= 0 khi pan am lon");

    // Truong hop 4: Pan cuc dai sang phai / duoi -> clamping khong tran khoi map
    const vpRight = calculateMinimapViewport({
      zoom: 2,
      pan: { x: 99999, y: 99999 },
      mapWidth,
      mapHeight,
      containerWidth,
      containerHeight,
    });
    assert.ok(vpRight.rectX <= mapWidth - vpRight.rectWidth, "rectX phai nam trong gioi han mapWidth");
    assert.ok(vpRight.rectY <= mapHeight - vpRight.rectHeight, "rectY phai nam trong gioi han mapHeight");
  });

  test("minimapClickToPan chuyen doi toa do click thanh pan canvas hop le", () => {
    const mapWidth = 120;
    const mapHeight = 90;
    const containerWidth = 800;
    const containerHeight = 600;
    const zoom = 2;

    // Click chinh giua minimap (60, 45) -> pan canvas ve trung tam (0, 0)
    const centerPan = minimapClickToPan(60, 45, mapWidth, mapHeight, containerWidth, containerHeight, zoom);
    assert.equal(centerPan.x, 0);
    assert.equal(centerPan.y, 0);

    // Click goc tren ben trai (0, 0) -> pan canvas sang duong
    const topLeftPan = minimapClickToPan(0, 0, mapWidth, mapHeight, containerWidth, containerHeight, zoom);
    assert.ok(topLeftPan.x > 0, "Pan X phai duong khi click goc trai");
    assert.ok(topLeftPan.y > 0, "Pan Y phai duong khi click goc tren");

    // Click goc duoi ben phai (120, 90) -> pan canvas sang am
    const bottomRightPan = minimapClickToPan(120, 90, mapWidth, mapHeight, containerWidth, containerHeight, zoom);
    assert.ok(bottomRightPan.x < 0, "Pan X phai am khi click goc phai");
    assert.ok(bottomRightPan.y < 0, "Pan Y phai am khi click goc duoi");
  });

  test("parseViewBox xu ly viewBox hop le va chuoi rong an toan", () => {
    const parsed = parseViewBox("0 0 4000 3000");
    assert.deepEqual(parsed, { minX: 0, minY: 0, width: 4000, height: 3000 });

    const fallback = parseViewBox("");
    assert.equal(fallback.minX, 0);
    assert.equal(fallback.width, 0);
  });
});
