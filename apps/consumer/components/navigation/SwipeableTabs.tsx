import React, { useRef, useCallback, useState } from "react";
import { View, StyleSheet } from "react-native";
import PagerView from "react-native-pager-view";
import { GlassTabBar, TabConfig } from "./GlassTabBar";

interface SwipeableTabsProps {
  children: React.ReactNode[];
  tabs: TabConfig[];
  initialPage?: number;
}

export function SwipeableTabs({
  children,
  tabs,
  initialPage = 0,
}: SwipeableTabsProps) {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(initialPage);

  const handlePageSelected = useCallback(
    (e: { nativeEvent: { position: number } }) => {
      setActiveIndex(e.nativeEvent.position);
    },
    []
  );

  const handleTabPress = useCallback((index: number) => {
    pagerRef.current?.setPage(index);
    setActiveIndex(index);
  }, []);

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={initialPage}
        onPageSelected={handlePageSelected}
      >
        {React.Children.map(children, (child, index) => (
          <View key={tabs[index]?.key || index} style={styles.page}>
            {child}
          </View>
        ))}
      </PagerView>

      <GlassTabBar
        tabs={tabs}
        activeIndex={activeIndex}
        onTabPress={handleTabPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
});
