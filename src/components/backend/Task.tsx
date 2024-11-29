import React, { useState, useEffect } from 'react';
import Card from './Card';
import { Draggable, Droppable } from 'react-beautiful-dnd';
import { TaskType } from '../../lib/DragDropSystem';

interface ListProps {
  id: string;
  title: string;
  tasks: TaskType[];
  index: number;
  onDelete: (id: string) => void;
  onUpdate: (id: string, newTitle: string) => void;
  onAdd: (id: string) => void;
  onUpdateCard: (id: string, cardId: string, updates: Partial<TaskType>) => void;
  onDeleteCard: (id: string, cardId: string) => void;
  isHorizontal?: boolean;
}

const List: React.FC<ListProps> = ({ 
  title, 
  index, 
  id, 
  tasks, 
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
  const [isAutoExpanded, setIsAutoExpanded] = useState(false);

  useEffect(() => {
    return () => {
      if (isAutoExpanded) {
        setIsAutoExpanded(false);
        setIsCollapsed(true);
      }
    };
  }, [isAutoExpanded]);

  const handleSave = () => {
    onUpdate(id, editedTitle);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedTitle(title);
    setIsEditing(false);
  };


  const handleAddTask = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onAdd(id);
  };

  return (
    <Draggable draggableId={id} index={index}>
      {(provided) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-[#161616] rounded-md group ${
            isHorizontal ? 'w-[300px] flex-shrink-0' : 'w-full'
          } flex flex-col px-4 pt-4 ${
            !isCollapsed ? 'pb-1' : ''
          }`}
          style={{
            ...provided.draggableProps.style,
            height: isHorizontal ? 'fit-content' : undefined,
            alignSelf: 'flex-start',
            flexShrink: 0
          }}
        >
          <div 
            {...provided.dragHandleProps}
            className="flex items-start justify-between mb-4 gap-2 list-header"
          >
            <div className="flex-1 min-w-0 relative mr-2 flex">
              {isEditing ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="bg-[#111111] rounded px-2 py-1 text-sm font-medium focus:outline-none text-white w-full"
                  style={{ maxWidth: '100%' }}
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
                <h3 className={`text-[#999999] group-hover:text-white transition-colors font-medium px-1 min-w-0 flex-1
                  ${isCollapsed ? 'truncate' : 'break-words whitespace-normal'}`}>
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
                  <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center z-20">
                    <div className="flex items-center gap-2 translate-x-2 opacity-0 group-hover/menu:translate-x-0 group-hover/menu:opacity-100 transition-all duration-200 bg-[#161616] shadow-md p-1 rounded-md">
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

          <Droppable droppableId={id} type="TASK" direction={isHorizontal ? "horizontal" : "vertical"}>
            {(dropProvided, dropSnapshot) => (
              <div
                ref={dropProvided.innerRef}
                {...dropProvided.droppableProps}
                className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2 rounded-md transition-colors
                  ${isCollapsed ? 'max-h-0 overflow-hidden' : 'max-h-[70vh] overflow-y-auto'} 
                  ${dropSnapshot.isDraggingOver ? 'bg-blue-500/5 ring-2 ring-blue-500/20' : ''}`}
                style={{
                  minHeight: isCollapsed ? 0 : '50px',
                }}
              >
                <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} gap-2 p-0.5`}>
                  {tasks?.map((task, index) => (
                    <Card
                      key={task.id}
                      id={task.id}
                      index={index}
                      title={task.title}
                      description={task.description}
                      onUpdate={(updates) => onUpdateCard(id, task.id, updates)}
                      onDelete={() => onDeleteCard(id, task.id)}
                      isHorizontal={isHorizontal} // Pass the prop here
                    />
                  ))}
                </div>
                {dropProvided.placeholder}
              </div>
            )}
          </Droppable>

          <div 
            className={`transition-all duration-200 ease-in-out overflow-hidden
              ${isCollapsed ? 'max-h-0 opacity-0' : 'max-h-[40px] opacity-100'}`}
            style={{
              transform: isCollapsed ? 'translateY(-8px)' : 'translateY(0)',
            }}
          >
            <button
              onClick={handleAddTask}
              className="w-full py-1 text-[#666666] hover:text-white transition-all duration-200 
                text-sm hover:bg-[#1a1a1a] rounded-md mt-2 opacity-0 group-hover:opacity-100"
            >
              + Add Task
            </button>
          </div>
        </div>
      )}
    </Draggable>
  );
};

export default List;
