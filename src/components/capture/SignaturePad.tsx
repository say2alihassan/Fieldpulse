import React, {
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { View, StyleSheet } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  runOnJS,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { captureRef } from 'react-native-view-shot';

// Create animated path component
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Point {
  x: number;
  y: number;
}

interface SignaturePadProps {
  strokeColor?: string;
  strokeWidth?: number;
  onStrokeEnd?: () => void;
}

export interface SignaturePadRef {
  clear: () => void;
  exportToPng: () => Promise<string>;
  isEmpty: () => boolean;
}

// Convert points to SVG path string (worklet)
function pointsToSvgPath(points: Point[]): string {
  'worklet';
  if (points.length < 2) return '';

  let path = `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`;

  // Use quadratic bezier curves for smooth lines
  for (let i = 1; i < points.length - 1; i++) {
    const midX = (points[i].x + points[i + 1].x) / 2;
    const midY = (points[i].y + points[i + 1].y) / 2;
    path += ` Q ${points[i].x.toFixed(2)} ${points[i].y.toFixed(2)} ${midX.toFixed(2)} ${midY.toFixed(2)}`;
  }

  // Connect to the last point
  if (points.length > 1) {
    const lastPoint = points[points.length - 1];
    path += ` L ${lastPoint.x.toFixed(2)} ${lastPoint.y.toFixed(2)}`;
  }

  return path;
}

const SignaturePad = forwardRef<SignaturePadRef, SignaturePadProps>(
  ({ strokeColor = '#000', strokeWidth = 2, onStrokeEnd }, ref) => {
    // Use shared values for 60fps performance on UI thread
    const currentPathPoints = useSharedValue<Point[]>([]);
    const currentPathString = useSharedValue('');
    const completedPaths = useSharedValue<string[]>([]);
    const pathCount = useSharedValue(0);

    const svgRef = useRef<View>(null);

    // Animated props for current drawing path
    const animatedCurrentPathProps = useAnimatedProps(() => ({
      d: currentPathString.value,
    }));

    // Callback when stroke ends (runs on JS thread)
    const handleStrokeEnd = useCallback(() => {
      onStrokeEnd?.();
    }, [onStrokeEnd]);

    // Pan gesture with worklet handlers for 60fps
    const panGesture = Gesture.Pan()
      .minDistance(0)
      .onStart((e) => {
        'worklet';
        currentPathPoints.value = [{ x: e.x, y: e.y }];
        currentPathString.value = `M ${e.x.toFixed(2)} ${e.y.toFixed(2)}`;
      })
      .onUpdate((e) => {
        'worklet';
        // Add point to current path
        const newPoints = [...currentPathPoints.value, { x: e.x, y: e.y }];
        currentPathPoints.value = newPoints;
        currentPathString.value = pointsToSvgPath(newPoints);
      })
      .onEnd(() => {
        'worklet';
        // Move current path to completed paths
        const finalPath = currentPathString.value;
        if (finalPath) {
          completedPaths.value = [...completedPaths.value, finalPath];
          pathCount.value = completedPaths.value.length;
        }
        currentPathPoints.value = [];
        currentPathString.value = '';

        if (onStrokeEnd) {
          runOnJS(handleStrokeEnd)();
        }
      });

    const clear = useCallback(() => {
      completedPaths.value = [];
      currentPathPoints.value = [];
      currentPathString.value = '';
      pathCount.value = 0;
    }, [completedPaths, currentPathPoints, currentPathString, pathCount]);

    const exportToPng = useCallback(async (): Promise<string> => {
      if (!svgRef.current) {
        throw new Error('SVG ref not available');
      }

      const uri = await captureRef(svgRef, {
        format: 'png',
        quality: 1,
        result: 'tmpfile',
      });

      return uri;
    }, []);

    const isEmpty = useCallback(() => {
      return completedPaths.value.length === 0 && currentPathString.value === '';
    }, [completedPaths, currentPathString]);

    useImperativeHandle(ref, () => ({
      clear,
      exportToPng,
      isEmpty,
    }));

    return (
      <GestureHandlerRootView style={styles.container}>
        <GestureDetector gesture={panGesture}>
          <Animated.View ref={svgRef} style={styles.canvas} testID="signature-pad">
            <Svg style={StyleSheet.absoluteFill}>
              {/* Completed paths */}
              <CompletedPaths
                paths={completedPaths}
                strokeColor={strokeColor}
                strokeWidth={strokeWidth}
              />
              {/* Current drawing path */}
              <AnimatedPath
                animatedProps={animatedCurrentPathProps}
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    );
  }
);

// Separate component for completed paths to avoid re-renders
interface CompletedPathsProps {
  paths: Animated.SharedValue<string[]>;
  strokeColor: string;
  strokeWidth: number;
}

function CompletedPaths({ paths, strokeColor, strokeWidth }: CompletedPathsProps): React.JSX.Element {
  // Note: This is a simplified version. In a production app, you might want to
  // use a more sophisticated approach with Skia for better performance.
  const animatedProps = useAnimatedProps(() => {
    // Combine all paths into one for better rendering performance
    return {
      d: paths.value.join(' '),
    };
  });

  return (
    <AnimatedPath
      animatedProps={animatedProps}
      stroke={strokeColor}
      strokeWidth={strokeWidth}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

SignaturePad.displayName = 'SignaturePad';

export default SignaturePad;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  canvas: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
