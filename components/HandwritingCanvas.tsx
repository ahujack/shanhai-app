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
  Platform,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 提升书写舒适度：放大书写区域
const CANVAS_SIZE = Math.min(SCREEN_WIDTH - 32, 360);
const PAPER_TEXTURE_POINTS = [
  { x: 18, y: 22, s: 2 }, { x: 46, y: 60, s: 1.5 }, { x: 74, y: 34, s: 2.5 },
  { x: 98, y: 92, s: 1.5 }, { x: 132, y: 48, s: 2 }, { x: 160, y: 74, s: 1.5 },
  { x: 188, y: 28, s: 2.2 }, { x: 224, y: 56, s: 1.7 }, { x: 252, y: 84, s: 2.3 },
  { x: 278, y: 40, s: 1.4 }, { x: 310, y: 70, s: 2.1 }, { x: 336, y: 30, s: 1.6 },
  { x: 24, y: 132, s: 1.6 }, { x: 62, y: 160, s: 2.1 }, { x: 88, y: 196, s: 1.4 },
  { x: 122, y: 142, s: 2.3 }, { x: 156, y: 178, s: 1.6 }, { x: 194, y: 148, s: 2.1 },
  { x: 228, y: 188, s: 1.6 }, { x: 264, y: 154, s: 2.4 }, { x: 296, y: 202, s: 1.5 },
  { x: 330, y: 172, s: 2.2 }, { x: 42, y: 244, s: 2.3 }, { x: 78, y: 282, s: 1.5 },
  { x: 116, y: 250, s: 2.2 }, { x: 148, y: 296, s: 1.6 }, { x: 186, y: 266, s: 2.3 },
  { x: 220, y: 308, s: 1.7 }, { x: 256, y: 272, s: 2.1 }, { x: 292, y: 316, s: 1.5 },
  { x: 326, y: 286, s: 2.2 },
];

interface Point {
  x: number;
  y: number;
}

interface BrushTrailPoint extends Point {
  id: string;
}

interface Stroke {
  points: Point[];
}

interface HandwritingCanvasProps {
  onRecognize: (svgString: string) => void;
  isRecognizing?: boolean;
  wuxing?: string;
}

export const HandwritingCanvas: React.FC<HandwritingCanvasProps> = ({ 
  onRecognize, 
  isRecognizing = false,
  wuxing,
}) => {
  // 使用 ref 来存储笔画数据，确保状态更新的准确性
  const strokesRef = useRef<Stroke[]>([]);
  const currentPointsRef = useRef<Point[]>([]);
  
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [currentPoints, setCurrentPoints] = useState<Point[]>([]);
  const [brushPoint, setBrushPoint] = useState<Point | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [brushTrail, setBrushTrail] = useState<BrushTrailPoint[]>([]);
  
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
    setBrushPoint(null);
    setIsDrawing(false);
    setBrushTrail([]);
  }, []);

  const getWuxingTheme = useCallback((wx?: string) => {
    const map: Record<string, { border: string; stroke: string; active: string; glow: string }> = {
      木: { border: '#65B867', stroke: '#1B4D24', active: '#7BEA89', glow: 'rgba(101,184,103,0.18)' },
      火: { border: '#FF8A65', stroke: '#6A1B09', active: '#FFB199', glow: 'rgba(255,138,101,0.2)' },
      土: { border: '#C9A769', stroke: '#5D4721', active: '#EED49A', glow: 'rgba(201,167,105,0.2)' },
      金: { border: '#E0C96D', stroke: '#4A4321', active: '#FFE693', glow: 'rgba(224,201,109,0.2)' },
      水: { border: '#6FA8FF', stroke: '#123A7B', active: '#A0C8FF', glow: 'rgba(111,168,255,0.22)' },
    };
    return map[wx || ''] || { border: '#FFD700', stroke: '#1a1a2e', active: '#FFE26A', glow: 'rgba(255,215,0,0.16)' };
  }, []);
  const wuxingTheme = getWuxingTheme(wuxing);

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
        setIsDrawing(true);
        setBrushPoint(newPoint);
        setBrushTrail([{ ...newPoint, id: `trail_${Date.now()}_start` }]);
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
        setBrushPoint(newPoint);
        setBrushTrail((prev) => {
          const next = [...prev, { ...newPoint, id: `trail_${Date.now()}_${prev.length}` }];
          return next.slice(-6);
        });
      },
      onPanResponderRelease: () => {
        if (currentPointsRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, { points: currentPointsRef.current }];
          setStrokes([...strokesRef.current]);
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
        setIsDrawing(false);
        setBrushPoint(null);
        setBrushTrail([]);
      },
      onPanResponderTerminate: () => {
        if (currentPointsRef.current.length > 0) {
          strokesRef.current = [...strokesRef.current, { points: currentPointsRef.current }];
          setStrokes([...strokesRef.current]);
        }
        currentPointsRef.current = [];
        setCurrentPoints([]);
        setIsDrawing(false);
        setBrushPoint(null);
        setBrushTrail([]);
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
      const progress = i / Math.max(1, points.length - 2);
      const taper = 1 - progress * 0.45; // 收笔更轻
      const startBoost = 1 + Math.max(0, 0.22 - progress * 0.22); // 起笔更重
      const speedFactor = Math.max(0.62, Math.min(1.18, 1.12 - length / 14)); // 快细慢粗
      const thickness = Math.max(3, Math.min(12, 8 * taper * startBoost * speedFactor));
      
      segments.push(
        <View
          key={`${i}-${isActive ? 'active' : 'normal'}`}
          style={[
            styles.segment,
            {
              left: p1.x,
              top: p1.y - thickness / 2,
              width: length + 1,
              height: thickness,
              borderRadius: thickness / 2,
              transform: [{ rotate: `${angle}deg` }],
              backgroundColor: isActive ? wuxingTheme.active : wuxingTheme.stroke,
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
        style={[
          styles.canvasContainer,
          { borderColor: wuxingTheme.border, shadowColor: wuxingTheme.border },
        ]} 
        {...panResponder.panHandlers}
      >
        {/* 背景 */}
        <View style={[styles.canvasBackground, { backgroundColor: '#fff' }]}>
          <View style={styles.paperTextureLayer}>
            {PAPER_TEXTURE_POINTS.map((dot, idx) => (
              <View
                key={`paper_dot_${idx}`}
                style={[
                  styles.paperDot,
                  {
                    left: dot.x,
                    top: dot.y,
                    width: dot.s,
                    height: dot.s,
                    borderRadius: dot.s / 2,
                  },
                ]}
              />
            ))}
          </View>
          <View style={[styles.canvasGlow, { backgroundColor: wuxingTheme.glow }]} />
          {/* 田字格参考线 */}
          <View style={[styles.gridLine, { left: '50%' }]} />
          <View style={[styles.gridLine, styles.gridHorizontal, { top: '50%' }]} />
        </View>
        
        {/* 渲染笔画层 */}
        <View style={styles.strokesLayer}>
          {renderAllStrokes()}
        </View>
        {isDrawing && brushTrail.length > 0 && (
          <View style={styles.brushTrailLayer}>
            {brushTrail.map((point, idx) => {
              const alpha = (idx + 1) / brushTrail.length;
              const size = 5 + alpha * 6;
              return (
                <View
                  key={point.id}
                  style={[
                    styles.brushTrailDot,
                    {
                      left: point.x - size / 2,
                      top: point.y - size / 2,
                      width: size,
                      height: size,
                      borderRadius: size / 2,
                      backgroundColor: `rgba(26,26,46,${0.1 + alpha * 0.22})`,
                    },
                  ]}
                />
              );
            })}
          </View>
        )}
        {isDrawing && brushPoint && (
          <View
            style={[
              styles.brushCursorWrap,
              {
                left: brushPoint.x - 12,
                top: brushPoint.y - 14,
              },
            ]}
          >
            <View style={[styles.brushTail, { backgroundColor: wuxingTheme.border }]} />
            <View style={[styles.brushHead, { borderColor: wuxingTheme.border }]}>
              <View style={styles.brushCore} />
            </View>
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
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    ...(Platform.OS === 'web' ? { cursor: 'none' as any } : {}),
  },
  canvasBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  paperTextureLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.26,
  },
  paperDot: {
    position: 'absolute',
    backgroundColor: '#d9d1c2',
  },
  canvasGlow: {
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
  brushTrailLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2,
  },
  brushTrailDot: {
    position: 'absolute',
  },
  segment: {
    position: 'absolute',
    height: 8,
    borderRadius: 4,
    transformOrigin: 'left center',
  },
  brushCursorWrap: {
    position: 'absolute',
    width: 24,
    height: 28,
    alignItems: 'center',
    justifyContent: 'flex-start',
    transform: [{ rotate: '-22deg' }],
    opacity: 0.95,
    zIndex: 3,
  },
  brushTail: {
    width: 4,
    height: 12,
    borderRadius: 2,
    marginBottom: -2,
  },
  brushHead: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brushCore: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#1a1a2e',
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
