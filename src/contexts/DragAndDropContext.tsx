import React from 'react';
import { DraggableProvided, DraggableStateSnapshot } from 'react-beautiful-dnd';
import { createPortal } from 'react-dom';

interface PortalAwareItemProps {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
  children: React.ReactNode;
}

export const PortalAwareItem: React.FC<PortalAwareItemProps> = ({ provided, snapshot, children }) => {
  const usePortal = snapshot.isDragging;

  const child = (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
      }}
    >
      {children}
    </div>
  );

  if (!usePortal) {
    return child;
  }
  return createPortal(child, document.body);
};
