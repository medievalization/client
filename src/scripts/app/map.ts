const smoothScroll: number = 5;
const renderDistance: number = 1;

/* Row, Column */
type Coordinates = [number, number];

class ChunkMap {
  /* Chunk array */
  firstRow: number;
  firstColumn: number;
  map: HTMLDivElement;

  constructor(firstRow: number, firstColumn: number) {
    this.firstRow = firstRow;
    this.firstColumn = firstColumn;

    this.map = document.querySelector("div#map-area");
    this.map.append(document.createElement("x-chunkmap-row"));
  }

  render(data: Array<Array<number>>): DocumentFragment {
    const fragment: DocumentFragment = document.createDocumentFragment();

    const chunk: HTMLElement = fragment.appendChild(
      document.createElement("x-chunk")
    );

    for (let i = 0; i < data.length; i++) {
      chunk.appendChild(document.createElement("x-chunk-row"));

      for (let j = 0; j < data[i].length; j++) {
        chunk.children[i].appendChild(document.createElement("x-chunk-tile"));
        (chunk.children[i].children[j] as HTMLElement).innerText =
          data[i][j].toString();
        (chunk.children[i].children[j] as HTMLElement).classList.add(
          `tile_${data[i][j].toString()}`
        );
      }
    }

    return fragment;
  }

  load(chunk: DocumentFragment, position: Coordinates): void {
    /* Step 1: Row */
    const lastRow: number = this.map.children.length + this.firstRow;

    console.log(position[0], this.firstRow, lastRow);

    if (position[0] < this.firstRow) {
      console.log("before firstrow");
      for (let row = 0; row < this.firstRow - position[0]; row++) {
        this.map.prepend(document.createElement("x-chunkmap-row"));
        this.firstRow = position[0];
      }
    } else if (position[0] >= lastRow) {
      console.log("after lastrow");
      for (
        let row = 0;
        row <= position[0] + 1 - this.map.children.length;
        row++
      ) {
        this.map.append(document.createElement("x-chunkmap-row"));
      }
    }

    const target: HTMLElement = this.map.children[
      this.firstRow + position[0]
    ] as HTMLElement;

    target.appendChild(chunk);
  }
}

const panelBound: DOMRect = document
  .querySelector("#map")
  .getBoundingClientRect();

function moveMap(): void {
  const map: HTMLTableElement = document.querySelector("#map-area");

  let isMoving = false;
  let position: [number, number] = [0, 0];
  let root: HTMLDivElement;

  map.addEventListener("mousedown", (): void => {
    isMoving = true;
  });

  map.addEventListener("mouseup", (): void => {
    isMoving = false;
  });

  map.addEventListener("mouseleave", (): void => {
    isMoving = false;
  });

  map.addEventListener("mouseenter", (event: MouseEvent): void => {
    if (event.buttons === 1) {
      isMoving = true;
    } else {
      isMoving = false;
    }
  });

  map.addEventListener("mousemove", (event: MouseEvent): void => {
    if (isMoving) {
      const left: number = Number(map.style.left.replace("px", ""));
      const top: number = Number(map.style.top.replace("px", ""));

      const [moveX, moveY] = [
        `${left + event.movementX}px`,
        `${top + event.movementY}px`,
      ];

      if (smoothScroll) {
        map.animate(
          [
            { left: `${left}px`, top: `${top}px` },
            { left: moveX, top: moveY },
          ],
          smoothScroll
        );
        setTimeout((): void => {
          map.style.left = moveX;
          map.style.top = moveY;
        }, smoothScroll);
      } else {
        map.style.left = moveX;
        map.style.top = moveY;
      }
    }
  });
}

export function initMap(): void {
  const socket: WebSocket = new WebSocket("ws://localhost:8765/");

  socket.addEventListener("open", (event: Event) => {
    console.log(event);
    socket.send(JSON.stringify({ type: "tile", data: null }));
  });

  socket.addEventListener("message", (event: MessageEvent) => {
    const data: any = JSON.parse(event.data);

    if (data.type === "tile") {
      /* render(data.data, [0, 0]); */
      // Experimental

      const chunkMap: ChunkMap = new ChunkMap(0, 0);
      chunkMap.load(chunkMap.render(data.data), [0, 0]);
      chunkMap.load(chunkMap.render(data.data), [1, 0]);
      chunkMap.load(chunkMap.render(data.data), [2, 0]);
      chunkMap.load(chunkMap.render(data.data), [4, 0]);
      chunkMap.load(chunkMap.render(data.data), [6, 0]);
    }
  });

  moveMap();
}
