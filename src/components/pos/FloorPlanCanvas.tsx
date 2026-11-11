/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Interactive Floor Plan Canvas
 * Displays tables positioned in 2D space:
 * - Free table = dark green border (border-2 border-emerald-700)
 * - Table with customers = red border (border-2 border-rose-600)
 * - Draggable freely to arrange table positions on the floor plan
 * - No status legend chips, no view toggle.
 */

import React, { useState, useRef } from 'react';
import { Users, Move, Clock, Receipt, Circle, Square, RectangleHorizontal } from 'lucide-react';
import { Table, TableType, TableStatus } from '../../types/models';
import { useStore } from '../../context/StoreContext';

interface FloorPlanCanvasProps {
  tables: Table[];
  activeTableId: string | null;
  onSelectTable: (table: Table) => void;
  onTableMoved: (tableId: string, positionX: number, positionY: number) => void;
  onEditTable?: (table: Table) => void;
}

export const FloorPlanCanvas: React.FC<FloorPlanCanvasProps> = ({
  tables,
  activeTableId,
  onSelectTable,
  onTableMoved,
  onEditTable,
}) => {
  const { lang, t } = useStore();
  const canvasRef = useRef<HTMLDivElement>(null);

  // Dragging State
  const [draggingTableId, setDraggingTableId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragCurrentPos, setDragCurrentPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent, table: Table) => {
    // Only drag with primary pointer
    if (e.button !== 0) return;
    e.stopPropagation();

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    setDraggingTableId(table.id);
    const startX = e.clientX - rect.left;
    const startY = e.clientY - rect.top;

    setDragOffset({
      x: startX - (table.positionX || 50),
      y: startY - (table.positionY || 50),
    });
    setDragCurrentPos({
      x: table.positionX || 50,
      y: table.positionY || 50,
    });

    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!draggingTableId) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left - dragOffset.x;
    const currentY = e.clientY - rect.top - dragOffset.y;

    // Clamp coordinates within the canvas boundaries
    const clampedX = Math.max(10, Math.min(rect.width - 120, currentX));
    const clampedY = Math.max(10, Math.min(rect.height - 120, currentY));

    setDragCurrentPos({ x: clampedX, y: clampedY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingTableId) return;

    onTableMoved(
      draggingTableId,
      Math.round(dragCurrentPos.x),
      Math.round(dragCurrentPos.y)
    );

    setDraggingTableId(null);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const renderTableShape = (type: TableType, chairs: number) => {
    switch (type) {
      case 'round':
        return 'rounded-full aspect-square w-28 h-28';
      case 'rect':
        return 'rounded-2xl w-40 h-28';
      case 'bar':
        return 'rounded-xl w-20 h-20';
      case 'square':
      default:
        return 'rounded-2xl w-28 h-28';
    }
  };

  return (
    <div
      ref={canvasRef}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-[620px] rounded-2xl bg-neutral-100/90 border border-neutral-200 overflow-hidden select-none shadow-inner"
      style={{
        backgroundImage: `radial-gradient(circle, #d4d4d8 1px, transparent 1px)`,
        backgroundSize: '24px 24px',
      }}
    >
      {/* Drag instruction notice */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 border border-neutral-200 text-[11px] text-neutral-500 backdrop-blur-xs pointer-events-none">
        <Move className="w-3.5 h-3.5 text-neutral-400" />
        <span>{t('dragHint')}</span>
      </div>

      {/* Render tables on 2D floorplan */}
      {tables.map((table) => {
        const isDragging = draggingTableId === table.id;
        const posX = isDragging ? dragCurrentPos.x : table.positionX || 50;
        const posY = isDragging ? dragCurrentPos.y : table.positionY || 50;

        const isOccupied = table.status === 'occupied' || Boolean(table.currentBillId);
        const isSelected = activeTableId === table.id;

        return (
          <div
            key={table.id}
            onPointerDown={(e) => handlePointerDown(e, table)}
            onClick={() => onSelectTable(table)}
            style={{
              transform: `translate3d(${posX}px, ${posY}px, 0)`,
              touchAction: 'none',
            }}
            className={`absolute cursor-move flex flex-col items-center justify-center p-2.5 transition-shadow ${
              renderTableShape(table.tableType, table.chairs)
            } ${
              isOccupied
                ? 'border-2 border-rose-600 bg-rose-50/80 shadow-md text-rose-950'
                : 'border-2 border-emerald-700 bg-white shadow-xs hover:shadow-md text-emerald-950'
            } ${
              isSelected ? 'ring-4 ring-amber-400' : ''
            } ${isDragging ? 'opacity-85 shadow-2xl scale-105 z-30' : 'z-20'}`}
          >
            {/* Table Number */}
            <span className="font-extrabold text-sm sm:text-base leading-tight tracking-tight">
              {table.number}
            </span>

            {/* Chairs count */}
            <div className="flex items-center gap-1 text-[11px] opacity-80 mt-0.5">
              <Users className="w-3 h-3" />
              <span className="font-semibold">{table.chairs}</span>
            </div>

            {/* Occupied Bill Info */}
            {isOccupied && table.currentBillNumber && (
              <div className="mt-1 px-1.5 py-0.5 rounded bg-rose-200/70 text-rose-900 text-[9px] font-bold tabular-nums truncate max-w-[90%] text-center">
                {table.currentBillNumber}
              </div>
            )}
          </div>
        );
      })}

      {tables.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 text-neutral-400">
          <p className="text-sm font-semibold">{t('noTablesInZone')}</p>
        </div>
      )}
    </div>
  );
};
