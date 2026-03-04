import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  PanResponder,
  Dimensions,
  TouchableOpacity,
  Text,
  Alert,
  Animated,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 减小画布尺寸，使用固定宽度而非屏幕宽度
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 80, 280);

interface Point {
  x: number;
  y: number;
}

interface Stroke {
  points: Point[];
}

interface HandwritingCanvasProps {
  onRecognize: (svgString: string) => void;
  isRecognizing?: boolean;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ 
  onRecognize, 
  isRecognizing = false 
}) => {
  // 使用 ref 来存储笔画数据，确保状态更新的准确性
  const strokesRef = useRef<Stroke[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  
  // 淡入动画
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const clearCanvas = useCallback(() => {
    strokesRef.current = [];
    currentPointsRef.current = [];
    setStrokes([]);
    setCurrentPoints([]);
  }, []);

  // 计算两个点之间的插值点
  const getInterpolatedPoints = (p1: Point, p2: Point): Point[] => {
    const points: Point[] = [];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(distance / 3));
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: Math.round(p1.x + dx * t),
        y: Math.round(p1.y + dy * t),
      });
    }
    
    return points;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        currentPointsRef.current = [newPoint];
        setCurrentPoints([newPoint]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        const newPoint = { x: locationX, y: locationY };
        
        if (currentPointsRef.current.length > 0) {
          const lastPoint = currentPointsRef.current[currentPointsRef.current.length - 1];
          const interpolated = getInterpolatedPoints(lastPoint, newPoint);
          currentPointsRef.current = [...currentPointsRef.current, ...interpolated];
        } else {
          currentPointsRef.current = [newPoint];
        }
        
        setCurrentPoints([...currentPointsRef.current]);
      },
      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, { points: currentPointsRef.current }];
          setStrokes([...strokesRef.current]);
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
      },
      onPanResponderTerminate: () => {
        if (currentPointsRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, { points: currentPointsRef.current }];
          setStrokes([...strokesRef.current]);
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
      },
    }),
  ).current;

  // 生成SVG字符串
  const generateSvgString = (): string => {
    let pathD = '';
    const allStrokes = [...strokesRef.current, { points: currentPointsRef.current }];
    
    allStrokes.forEach((stroke) => {
      if (stroke.points.length > 0) {
        pathD += `M ${stroke.points[0].x} ${stroke.points[0].y} `;
        stroke.points.slice(1).forEach((point) => {
          pathD += `L ${point.x} ${point.y} `;
        });
      }
    });

    const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS_SIZE}" height="${CANVAS_SIZE}" viewBox="0 0 ${CANVAS_SIZE} ${CANVAS_SIZE}">
  <rect width="100%" height="100%" fill="white"/>
  <path d="${pathD}" stroke="black" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;
    
    return svgString;
  };

  const handleRecognize = () => {
    if (strokesRef.current.length === 0 && currentPointsRef.current.length === 0) {
      Alert.alert('提示', '请先写一个字');
      return;
    }
    const svgString = generateSvgString();
    onRecognize(svgString);
  };

  // 渲染单个笔画
  const renderStroke = (points: Point[], isActive: boolean = false) => {
    if (points.length < 2) return null;
    
    // 将点转换为线段
    const segments: JSX.Element[] = [];
    
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      
      segments.push(
        <View
          key={`${i}-${isActive ? 'active' : 'normal'}`}
          style={[
            styles.segment,
            {
              left: p1.x,
              top: p1.y,
              width: length + 1,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: isActive ? '#FFD700' : '#1a1a2e',
            },
          ]}
        />
      );
    }
    
    return segments;
  };

  // 渲染所有笔画
  const renderAllStrokes = () => {
    const elements: JSX.Element[] = [];
    
    // 渲染已完成的笔画
    strokes.forEach((stroke, strokeIndex) => {
      elements.push(
        <View key={`stroke-${strokeIndex}`} style={styles.strokeLayer}>
          {renderStroke(stroke.points, false)}
        </View>
      );
    });
    
    // 渲染当前正在写的笔画
    if (currentPoints.length > 0) {
      elements.push(
        <View key="current-stroke" style={styles.strokeLayer}>
          {renderStroke(currentPoints, true)}
        </View>
      );
    }
    
    return elements;
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View 
        style={styles.canvasContainer} 
        {...panResponder.panHandlers}
      >
        {/* 背景 */}
        <View style={styles.canvasBackground}>
          {/* 田字格参考线 */}
          <View style={[styles.gridLine, { left: '50%' }]} />
          <View style={[styles.gridLine, styles.gridHorizontal, { top: '50%' }]} />
        </View>
        
        {/* 渲染笔画层 */}
        <View style={styles.strokesLayer}>
          {renderAllStrokes()}
        </View>
      </View>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity 
          style={styles.clearButton} 
          onPress={clearCanvas}
          activeOpacity={0.7}
        >
          <Text style={styles.clearButtonText}>🗑️ 清空</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.recognizeButton, 
            isRecognizing && styles.recognizeButtonDisabled
          ]}
          onPress={handleRecognize}
          disabled={isRecognizing}
          activeOpacity={0.7}
        >
          <Text style={styles.recognizeButtonText}>
            {isRecognizing ? '🔍 识别中...' : '✨ 开始识别'}
          </Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  canvasContainer: {
    width: CANVAS_SIZE,
    height: CANVAS_SIZE,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFD700',
    position: 'relative',
  },
  canvasBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#e8e8e8',
    width: 1,
    height: '100%',
    left: '50%',
  },
  gridHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
    left: 0,
  },
  strokesLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  strokeLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  segment: {
    position: 'absolute',
    height: 6,
    borderRadius: 3,
    transformOrigin: 'left center',
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 16,
  },
  clearButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#2a2a4e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a5e',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  recognizeButton: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    backgroundColor: '#FFD700',
    borderRadius: 12,
  },
  recognizeButtonDisabled: {
    backgroundColor: '#999',
  },
  recognizeButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HandwritingCanvas;
