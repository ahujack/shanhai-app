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
  ScrollView,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CANVAS_SIZE = SCREEN_WIDTH - 60;

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
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [canvasReady, setCanvasReady] = useState(false);
  
  // 淡入动画
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // 组件挂载时淡入
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setCanvasReady(true);
  }, [fadeAnim]);

  const clearCanvas = useCallback(() => {
    setStrokes([]);
    setCurrentPoints([]);
  }, []);

  // 计算两个点之间的所有点（用于绘制连续的线）
  const getPointsBetween = (p1: Point, p2: Point): Point[] => {
    const points: Point[] = [p1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.floor(distance / 2)); // 每2像素一个点
    
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      points.push({
        x: p1.x + dx * t,
        y: p1.y + dy * t,
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
        setCurrentPoints([{ x: locationX, y: locationY }]);
      },
      onPanResponderMove: (evt) => {
        const { locationX, locationY } = evt.nativeEvent;
        setCurrentPoints(prev => {
          if (prev.length === 0) return [{ x: locationX, y: locationY }];
          
          const lastPoint = prev[prev.length - 1];
          const newPoints = getPointsBetween(lastPoint, { x: locationX, y: locationY });
          return [...prev, ...newPoints.slice(1)];
        });
      },
      onPanResponderRelease: () => {
        if (currentPoints.length > 0) {
          setStrokes(prev => [...prev, { points: currentPoints }]);
        }
        setCurrentPoints([]);
      },
      onPanResponderTerminate: () => {
        if (currentPoints.length > 0) {
          setStrokes(prev => [...prev, { points: currentPoints }]);
        }
        setCurrentPoints([]);
      },
    }),
  ).current;

  // 生成SVG字符串
  const generateSvgString = (): string => {
    let pathD = '';
    const allStrokes = [...strokes, { points: currentPoints }];
    
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
    if (strokes.length === 0 && currentPoints.length === 0) {
      Alert.alert('提示', '请先写一个字');
      return;
    }
    const svgString = generateSvgString();
    onRecognize(svgString);
  };

  // 渲染笔画 - 使用点来模拟
  const renderStroke = (points: Point[], isActive: boolean = false) => {
    if (points.length < 2) return null;
    
    return points.map((point, index) => (
      <View
        key={index}
        style={[
          styles.dot,
          {
            left: point.x - 4,
            top: point.y - 4,
            backgroundColor: isActive ? '#FFD700' : '#1a1a2e',
          },
        ]}
      />
    ));
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
          <View style={[styles.gridLine, styles.gridVertical, { left: '50%' }]} />
          <View style={[styles.gridLine, styles.gridHorizontal, { top: '50%' }]} />
        </View>
        
        {/* 渲染已完成的笔画 */}
        {strokes.map((stroke, index) => (
          <View key={index} style={styles.strokeContainer}>
            {renderStroke(stroke.points)}
          </View>
        ))}
        
        {/* 渲染当前正在写的笔画 */}
        {currentPoints.length > 0 && (
          <View style={styles.strokeContainer}>
            {renderStroke(currentPoints, true)}
          </View>
        )}
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
    backgroundColor: '#f0f0f0',
  },
  gridVertical: {
    width: 1,
    height: '100%',
    left: '50%',
  },
  gridHorizontal: {
    width: '100%',
    height: 1,
    top: '50%',
  },
  strokeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
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
