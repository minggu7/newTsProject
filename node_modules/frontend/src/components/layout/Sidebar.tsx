import React from 'react';
import { SidebarType } from '../../types/layout';

const dummySidebarMenus: SidebarType[] = [
  {
    menuId: 1,
    title: '대메뉴1',
    url: '/main1',
    menuLevel: 1,
    rootMenuId: 1,
    parentMenuId: 0,
    sortOrder: 1,
    useYn: 'Y',
    createAt: '2024-07-01',
    children: [
      {
        menuId: 2,
        title: '중메뉴1-1',
        url: '/main1/sub1',
        menuLevel: 2,
        rootMenuId: 1,
        parentMenuId: 1,
        sortOrder: 1,
        useYn: 'Y',
        createAt: '2024-07-01',
        children: [
          {
            menuId: 3,
            title: '소메뉴1-1-1',
            url: '/main1/sub1/subsub1',
            menuLevel: 3,
            rootMenuId: 1,
            parentMenuId: 2,
            sortOrder: 1,
            useYn: 'Y',
            createAt: '2024-07-01'
          }
        ]
      }
    ]
  },
  // ...다른 대메뉴
];

const renderSidebarMenu = (menus: SidebarType[]) => (
  <ul>
    {menus.map(menu => (
      <li key={menu.menuId}>
        <a href={menu.url}>{menu.title}</a>
        {menu.children && menu.children.length > 0 && renderSidebarMenu(menu.children)}
      </li>
    ))}
  </ul>
);

const Sidebar = () => (
  <aside style={{ width: 180, background: '#eee', padding: 16, minHeight: 'calc(100vh - 60px)' }}>
    {renderSidebarMenu(dummySidebarMenus)}
  </aside>
);

export default Sidebar;