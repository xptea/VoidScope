import React, { useState, useRef } from 'react';
import Card from './Card';
import { Draggable, Droppable } from 'react-beautiful-dnd';

interface CardType {
  id: string;
  title: string;
  description: string;
}

interface ListProps {
  title: string;
  index: number;
  id: string;
  cards: CardType[];
  onDelete: (listId: string) => void;
  onUpdate: (listId: string, newTitle: string) => void;
  onAdd: (listId: string, card?: { title: string; description: string }) => void;
  onUpdateCard: (listId: string, cardId: string, updates: Partial<CardType>) => void;
  onDeleteCard: (listId: string, cardId: string) => void;
  isHorizontal: boolean;
}

const List: React.FC<ListProps> = ({ 
  title, 
  index, 
  id, 
  cards, 
  onDelete, 
  onUpdate, 
  onAdd, 
  onUpdateCard, 
  onDeleteCard, 
  isHorizontal 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);
  const isDraggingOverRef = useRef(false);

  const handleSave = () => {
    onUpdate(id, editedTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      <Draggable draggableId={id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`bg-[#161616] rounded-md group ${
              isHorizontal ? 'w-[300px] flex-shrink-0' : 'w-full max-w-[300px]'
            } flex flex-col overflow-hidden ${
              !isCollapsed ? (snapshot.isDragging || isDraggingOverRef.current ? 'pb-1' : 'pb-1 hover:pb-[28px]') : 'pb-1'
            } px-4 pt-4 ${snapshot.isDragging ? 'shadow-xl' : 'shadow-lg hover:bg-[#171717]'}`}
            style={{
              ...provided.draggableProps.style,
              transform: provided.draggableProps.style?.transform,
              transition: snapshot.isDragging 
                ? provided.draggableProps.style?.transition 
                : 'background-color 0.2s ease, box-shadow 0.2s ease',
            }}
            onDoubleClick={handleDoubleClick}
          >
            <div 
              {...provided.dragHandleProps}
              className="flex items-start justify-between mb-4 gap-2"
            >
              <div className="flex-1 min-w-0 relative">
                {isEditing ? (
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="bg-[#111111] rounded px-2 py-1 text-sm font-medium focus:outline-none text-white w-full"
                    style={{ maxWidth: '200px' }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSave();
                      }
                      if (e.key === 'Escape') {
                        handleCancel();
                      }
                    }}
                  />
                ) : (
                  <h3 className="text-[#999999] group-hover:text-white transition-colors font-medium px-1 break-words">
                    {title}
                  </h3>
                )}
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {!isEditing && (
                  <div className="relative group/menu">
                    <button className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-lg transition-all duration-200 transform group-hover/menu:rotate-90">
                      ≡
                    </button>
                    <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center">
                      <div className="flex items-center gap-2 translate-x-2 opacity-0 group-hover/menu:translate-x-0 group-hover/menu:opacity-100 transition-all duration-200">
                        <button
                          onClick={() => setIsEditing(true)}
                          className="text-[#666666] hover:text-white w-6 h-6 flex items-center justify-center text-base"
                        >
                          ✎
                        </button>
                        <button
                          onClick={() => onDelete(id)}
                          className="text-[#666666] hover:text-red-500 w-6 h-6 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 7V18C6 19.1046 6.89543 20 8 20H16C17.1046 20 18 19.1046 18 18V7M6 7H5M6 7H8M18 7H19M18 7H16M8 7V5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7M8 7H16M10 11V16M14 11V16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {isEditing && (
                  <div className="flex gap-1">
                    <button
                      onClick={handleSave}
                      className="text-green-500 hover:text-green-400 w-6 h-6 flex items-center justify-center text-base"
                    >
                      ✓
                    </button>
                    <button
                      onClick={handleCancel}
                      className="text-red-500 hover:text-red-400 w-6 h-6 flex items-center justify-center text-base"
                    >
                      ×
                    </button>
                  </div>
                )}

                <div className="h-4 w-[1px] bg-[#222222] mx-1"></div>

                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="text-[#666666] hover:text-white transition-colors w-6 h-6 flex items-center justify-center"
                >
                  {isCollapsed ? '▼' : '▲'}
                </button>
              </div>
            </div>

            {!isCollapsed && (
              <Droppable droppableId={id} type="CARD">
                {(dropProvided, dropSnapshot) => {
                  isDraggingOverRef.current = dropSnapshot.isDraggingOver;
                  return (
                    <div
                      ref={dropProvided.innerRef}
                      {...dropProvided.droppableProps}
                      className={`flex flex-col gap-3 flex-1 min-h-[50px] overflow-y-auto p-0.5 rounded-md transition-colors duration-200
                        ${dropSnapshot.isDraggingOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20' : ''}`}
                    >
                      {cards?.map((card, cardIndex) => (
                        <Card
                          key={card.id}
                          id={card.id}
                          index={cardIndex}
                          title={card.title}
                          description={card.description}
                          onUpdate={(updates) => onUpdateCard(id, card.id, updates)}
                          onDelete={() => onDeleteCard(id, card.id)}
                        />
                      ))}
                      {dropProvided.placeholder}
                    </div>
                  );
                }}
              </Droppable>
            )}

            {!isCollapsed && !snapshot.isDragging && !isDraggingOverRef.current && (
              <button
                onClick={() => onAdd(id)}
                className={`w-full -mb-[27px] group-hover:mb-0 py-1 text-[#666666] hover:text-white transition-all duration-200 text-sm opacity-0 group-hover:opacity-100 hover:bg-[#1a1a1a] rounded-md mt-2
                  ${(snapshot.isDragging || isDraggingOverRef.current) ? 'hidden' : ''}`}
              >
                + Add Card
              </button>
            )}
          </div>
        )}
      </Draggable>
    </>
  );
};

export default List;
