import { Add20, ChevronDown20, Close20, Menu20, Subtract20 } from '@carbon/icons-react';
import {
  Header,
  HeaderGlobalAction,
  HeaderGlobalBar,
  HeaderMenuItem,
  HeaderNavigation,
  InlineLoading,
} from 'carbon-components-react';
import { Stack } from 'office-ui-fabric-react';
import Trigger from 'rc-trigger';
import React, { useCallback, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Router, Switch, Route, Link, LinkProps } from 'react-router-dom';
import { useLocalStorage } from 'react-use';
import { NavMenu } from './components';
import ExtensionBanner from './components/ExtensionBanner';
import ExtensionHeaderItem from './components/ExtensionHeaderItem';
import { getConfig } from './config';
import { ExtInstallStatusProvider } from './context/ExtInstallStatus';
import { RenderStackProvider } from './context/RenderStack';
import useGapi from './hooks/useGapi';
import useLoadDriveFiles from './hooks/useLoadDriveFiles';
import { HeaderTitle, Content, HeaderUserAction, Sider, HeaderUserMenu } from './layout';
import HeaderSearch from './layout/HeaderSearch';
import Page from './pages/Page';
import { SearchResult, SearchTag } from './pages/Search';
import SearchAllTags from './pages/Search/AllTags';
import Settings from './pages/Settings';
import { selectMapIdToFile } from './reduxSlices/files';
import { collapseAll, expand } from './reduxSlices/siderTree';
import { history } from './utils';

function DriveFilesLoader({ children }) {
  useLoadDriveFiles();
  return <>{children}</>;
}

function useExtensionBannerController() {
  const [isDismissed, setIsDismissed] = useLocalStorage('extension.banner.dismissed', false);
  const [visible, setVisible] = useState(!isDismissed);

  const handleDismiss = useCallback(() => {
    setIsDismissed(true);
    setVisible(false);
  }, [setIsDismissed]);

  const showBanner = useCallback(() => {
    setVisible(true);
  }, []);

  return {
    visible,
    handleDismiss,
    showBanner,
  };
}

function App() {
  const dispatch = useDispatch();
  const { gapiLoaded } = useGapi();
  const [isExpanded, setIsExpanded] = useState(true);
  const mapIdToFile = useSelector(selectMapIdToFile);

  const handleOpenTOC = useCallback(() => setIsExpanded(true), []);
  const handleCloseTOC = useCallback(() => setIsExpanded(false), []);
  const handleTreeExpand = useCallback(() => {
    let ids: string[] = [];
    for (let id in mapIdToFile) {
      ids.push(id);
    }
    dispatch(expand(ids));
  }, [mapIdToFile, dispatch]);
  const handleTreeCollapse = useCallback(() => dispatch(collapseAll()), [dispatch]);

  const extBannerCtrl = useExtensionBannerController();

  if (!gapiLoaded) {
    return <InlineLoading description="Loading Google API..." />;
  }

  return (
    <ExtInstallStatusProvider>
      <ExtensionBanner visible={extBannerCtrl.visible} onDismiss={extBannerCtrl.handleDismiss} />
      <Router history={history}>
        <DriveFilesLoader>
          <Header>
            {!isExpanded && (
              <HeaderGlobalAction key="open" aria-label="Open TOC" onClick={handleOpenTOC}>
                <Menu20 />
              </HeaderGlobalAction>
            )}
            {isExpanded && (
              <HeaderGlobalAction key="close" aria-label="Close TOC" onClick={handleCloseTOC}>
                <Close20 />
              </HeaderGlobalAction>
            )}
            {isExpanded && (
              <HeaderGlobalAction key="expand" aria-label="Expand All" onClick={handleTreeExpand}>
                <Add20 />
              </HeaderGlobalAction>
            )}
            {isExpanded && (
              <HeaderGlobalAction
                key="collapse"
                aria-label="Collapse All"
                onClick={handleTreeCollapse}
              >
                <Subtract20 />
              </HeaderGlobalAction>
            )}
            <HeaderTitle />
            <HeaderNavigation>
              <HeaderMenuItem<LinkProps> element={Link} to="/search/tag">
                All Tags
              </HeaderMenuItem>
              {getConfig().NavItems.map((item) => {
                switch (item.type) {
                  case 'link':
                    return (
                      <HeaderMenuItem href={item.href} target={item.target}>
                        {item.text ?? ''}
                      </HeaderMenuItem>
                    );
                  case 'group':
                    return (
                      <Trigger
                        popupAlign={{
                          points: ['tl', 'bl'],
                        }}
                        mouseLeaveDelay={0.3}
                        zIndex={10000}
                        action="hover"
                        popup={
                          <NavMenu>
                            {item.children?.map((childItem) => {
                              switch (childItem.type) {
                                case 'divider':
                                  return <NavMenu.Divider>{childItem.text ?? ''}</NavMenu.Divider>;
                                case 'link':
                                  return (
                                    <NavMenu.Link href={childItem.href} target={childItem.target}>
                                      {childItem.text ?? ''}
                                    </NavMenu.Link>
                                  );
                                default:
                                  return null;
                              }
                            })}
                          </NavMenu>
                        }
                        popupTransitionName="slide-up"
                      >
                        <HeaderMenuItem href="javascript:;">
                          <Stack verticalAlign="center" horizontal tokens={{ childrenGap: 8 }}>
                            <span>{item.text ?? ''}</span>
                            <ChevronDown20 />
                          </Stack>
                        </HeaderMenuItem>
                      </Trigger>
                    );
                  default:
                    return null;
                }
              })}
              <ExtensionHeaderItem onClick={extBannerCtrl.showBanner} />
            </HeaderNavigation>
            <HeaderGlobalBar>
              <HeaderSearch />
              <Trigger
                popupAlign={{
                  points: ['tr', 'br'],
                }}
                mouseLeaveDelay={0.2}
                zIndex={10000}
                action="hover"
                popup={<HeaderUserMenu />}
                popupTransitionName="slide-up"
              >
                <div>
                  <HeaderUserAction />
                </div>
              </Trigger>
            </HeaderGlobalBar>
            <Sider isExpanded={isExpanded} />
          </Header>
          <Content isExpanded={isExpanded}>
            <RenderStackProvider>
              <Switch>
                <Route exact path="/">
                  <Page />
                </Route>
                <Route exact path="/view/:id">
                  <Page />
                </Route>
                <Route exact path="/view/:id/settings">
                  <Settings />
                </Route>
                <Route exact path="/search/keyword/:keyword">
                  <SearchResult />
                </Route>
                <Route exact path="/search/tag">
                  <SearchAllTags />
                </Route>
                <Route exact path="/search/tag/:tag">
                  <SearchTag />
                </Route>
              </Switch>
            </RenderStackProvider>
          </Content>
        </DriveFilesLoader>
      </Router>
    </ExtInstallStatusProvider>
  );
}

export default App;