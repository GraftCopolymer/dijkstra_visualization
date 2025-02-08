import { useEffect, useState } from "react";
import ReactDOM from "react-dom";

export type MenuItem = {
    id: string;
    label: string;
    handler: () => void;
    disabled?: boolean;
  };
  
  type MenuConfig = {
    [type: string]: MenuItem[];
  };
  
  type Position = {
    x: number;
    y: number;
  };
  
  export const useContextMenu = (menuConfig: MenuConfig) => {
    const [visible, setVisible] = useState(false);
    const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
    const [currentType, setCurrentType] = useState<string | null>(null);
    const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  
    const showMenu = (type: string, pos: Position, target: HTMLElement) => {
      setCurrentType(type);
      setPosition(pos);
      setTargetElement(target);
      setVisible(true);
    };
  
    const hideMenu = () => {
      setVisible(false);
      setCurrentType(null);
      setTargetElement(null);
    };
  
    useEffect(() => {
      const handleContextMenu = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        const contextMenuType = target.closest<HTMLElement>('[data-context-menu-type]');
        
        if (contextMenuType) {
          e.preventDefault();
          const type = contextMenuType.dataset.contextMenuType || 'default';
          showMenu(type, { x: e.clientX, y: e.clientY }, contextMenuType);
        }
      };
  
      const handleClick = (e: MouseEvent) => {
        if (!(e.target as Element).closest('.custom-context-menu')) {
          hideMenu();
        }
      };
  
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('click', handleClick);
  
      return () => {
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('click', handleClick);
      };
    }, []);
  
    const ContextMenuComponent = () => {
      if (!visible || !currentType) return null;
  
      const menuItems = menuConfig[currentType] || [];
  
      return ReactDOM.createPortal(
        <div
          className="custom-context-menu fixed bg-white shadow-lg rounded-md py-2 z-50"
          style={{ left: position.x, top: position.y }}
        >
          {menuItems.map((item) => (
            <div
              key={item.id}
              onClick={() => {
                item.handler();
                hideMenu();
              }}
              className={`px-4 py-2 hover:bg-gray-100 cursor-pointer ${
                item.disabled ? 'text-gray-400 cursor-not-allowed' : ''
              }`}
            >
              {item.label}
            </div>
          ))}
        </div>,
        document.body
      );
    };
  
    return {
      ContextMenuComponent,
      showContextMenu: showMenu,
      hideContextMenu: hideMenu,
      targetElement,
    };
  };