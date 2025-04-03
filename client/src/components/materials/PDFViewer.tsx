import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import * as fabric from 'fabric';
import { Spin, Button, message, Tooltip, Space, Alert } from 'antd';
import { 
  ZoomInOutlined, 
  ZoomOutOutlined, 
  HighlightOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SaveOutlined,
  UndoOutlined,
  ForwardOutlined,
  BackwardOutlined
} from '@ant-design/icons';
import axios from 'axios';
import { useSelector } from 'react-redux';
import './PDFViewer.css';

// 设置特定版本的PDF.js
const pdfjsVersion = pdfjs.version;
console.log('当前PDF.js版本:', pdfjsVersion);
// 设置worker路径，确保与当前版本匹配
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsVersion}/build/pdf.worker.min.mjs`;

// 工具类型定义
enum ToolType {
  PEN = 'pen',
  HIGHLIGHTER = 'highlighter',
  ERASER = 'eraser',
  NONE = 'none'
}

interface AnnotationData {
  id?: string | number;
  materialId: string | number;
  userId: string | number;
  annotationObjects: string; // JSON字符串格式的fabric对象
  pageNumber: number;
  createdAt?: string;
}

interface PDFViewerProps {
  fileUrl: string;
  materialId: string | number;
}

interface RootState {
  auth: {
    userInfo: {
      id?: string | number;
      _id?: string | number;
    }
  }
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, materialId }) => {
  console.log('PDFViewer 组件被调用:', { fileUrl, materialId });
  
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentTool, setCurrentTool] = useState<ToolType>(ToolType.NONE);
  const [fabricCanvas, setFabricCanvas] = useState<fabric.Canvas | null>(null);
  const [annotations, setAnnotations] = useState<AnnotationData[]>([]);
  const [unsavedChanges, setUnsavedChanges] = useState<boolean>(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const userInfo = useSelector((state: RootState) => state.auth.userInfo);

  // 文档加载完成的回调
  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    console.log('PDF文档加载成功，页数:', numPages);
    setNumPages(numPages);
    setLoading(false);
    setPdfError(null);
  };

  // 页面渲染完成的回调
  const onPageRenderSuccess = () => {
    // 页面渲染完成后初始化canvas
    initializeFabricCanvas();
    // 加载当前页面的标注
    loadAnnotationsForPage(pageNumber);
  };

  // 初始化fabric.js画布
  const initializeFabricCanvas = () => {
    if (!canvasRef.current || !canvasContainerRef.current) return;

    // 如果已有canvas，先销毁
    if (fabricCanvas) {
      fabricCanvas.dispose();
    }

    // 获取PDF页面尺寸
    const pageContainer = canvasContainerRef.current.querySelector('.react-pdf__Page') as HTMLElement;
    if (!pageContainer) return;

    const pageWidth = pageContainer.clientWidth;
    const pageHeight = pageContainer.clientHeight;

    // 设置canvas尺寸
    canvasRef.current.width = pageWidth;
    canvasRef.current.height = pageHeight;

    // 创建新的fabric canvas
    const canvas = new fabric.Canvas(canvasRef.current, {
      isDrawingMode: false,
      width: pageWidth,
      height: pageHeight,
      backgroundColor: 'transparent'
    });
    // 对触控笔事件的特殊处理，增强iPad体验
    canvas.on('mouse:wheel' as any, function(e: any) {
      if (e.e && e.e.touches && e.e.touches.length > 1) {
        // 避免多指触控导致的画线问题
        canvas.isDrawingMode = false;
      }
    });

    // 使用触摸事件处理多指触控
    canvas.on('touch:longpress' as any, function(e: any) {
      if (e.e && e.e.touches && e.e.touches.length > 1) {
        canvas.isDrawingMode = false;
      }
    });

    // 针对iPad pencil优化
    canvas.on('mouse:down', function(e: any) {
      const evt = e.e as PointerEvent;
      if (evt.pointerType === 'pen') {
        // iPad pencil特殊处理
        canvas.isDrawingMode = currentTool !== ToolType.NONE;
      }
    });

    // 监听鼠标移动来处理触摸事件
    canvas.on('mouse:move', function(e: any) {
      if (e.e && e.e.touches && e.e.touches.length > 1) {
        // 多指触控时禁用绘图模式
        canvas.isDrawingMode = false;
      }
    });

    // 绘制结束时标记有未保存的更改
    canvas.on('path:created', function() {
      setUnsavedChanges(true);
    });

    // 对象更改时标记有未保存的更改
    canvas.on('object:modified', function() {
      setUnsavedChanges(true);
    });

    setFabricCanvas(canvas);
  };

  // 根据工具类型设置画笔样式
  const configureBrush = useCallback(() => {
    if (!fabricCanvas) return;

    switch (currentTool) {
      case ToolType.PEN:
        fabricCanvas.isDrawingMode = true;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.width = 2;
          fabricCanvas.freeDrawingBrush.color = '#FF0000'; // 红色
        }
        break;
      case ToolType.HIGHLIGHTER:
        fabricCanvas.isDrawingMode = true;
        if (fabricCanvas.freeDrawingBrush) {
          fabricCanvas.freeDrawingBrush.width = 20;
          fabricCanvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.3)'; // 半透明黄色
        }
        break;
      case ToolType.ERASER:
        // 启用橡皮擦模式（实际上是选择并删除对象）
        fabricCanvas.isDrawingMode = false;
        break;
      case ToolType.NONE:
      default:
        fabricCanvas.isDrawingMode = false;
        break;
    }
  }, [fabricCanvas, currentTool]);

  // 当工具改变时重新配置画笔
  useEffect(() => {
    configureBrush();
  }, [currentTool, configureBrush]);

  // 加载指定页面的标注
  const loadAnnotationsForPage = useCallback(async (pageNum: number) => {
    if (!fabricCanvas || !userInfo) return;

    try {
      const response = await axios.get(`/api/materials/${materialId}/annotations`, {
        params: { pageNumber: pageNum }
      });

      if (response.data && Array.isArray(response.data) && response.data.length > 0) {
        // 清除现有内容
        fabricCanvas.clear();

        // 找到当前页面的标注
        const pageAnnotation = response.data.find((a: AnnotationData) => a.pageNumber === pageNum);
        
        if (pageAnnotation) {
          // 加载标注数据到canvas
          fabricCanvas.loadFromJSON(pageAnnotation.annotationObjects, () => {
            fabricCanvas.renderAll();
          });
        }

        // 保存所有标注数据
        setAnnotations(response.data as AnnotationData[]);
      }
    } catch (error) {
      console.error('加载标注出错:', error);
    }
  }, [fabricCanvas, userInfo, materialId]);

  // 保存当前页面的标注
  const saveAnnotations = useCallback(async () => {
    if (!fabricCanvas || !userInfo) {
      message.error('未登录或标注系统未就绪');
      return;
    }

    try {
      setLoading(true);
      
      // 获取canvas上的所有对象并序列化
      const annotationJSON = JSON.stringify(fabricCanvas.toJSON());
      
      // 创建标注数据
      const annotationData: AnnotationData = {
        materialId,
        userId: userInfo.id || userInfo._id || '',
        annotationObjects: annotationJSON,
        pageNumber: pageNumber
      };

      // 检查是更新还是创建新标注
      const existingAnnotation = annotations.find(a => a.pageNumber === pageNumber);
      
      if (existingAnnotation && existingAnnotation.id) {
        // 更新现有标注
        await axios.put(`/api/materials/${materialId}/annotations/${existingAnnotation.id}`, annotationData);
      } else {
        // 创建新标注
        const response = await axios.post(`/api/materials/${materialId}/annotations`, annotationData);
        // 将新标注添加到标注列表
        setAnnotations([...annotations, response.data as AnnotationData]);
      }

      message.success('标注已保存');
      setUnsavedChanges(false);
    } catch (error) {
      console.error('保存标注出错:', error);
      message.error('保存标注失败，请重试');
    } finally {
      setLoading(false);
    }
  }, [fabricCanvas, userInfo, materialId, pageNumber, annotations]);

  // 处理下一页
  const goToNextPage = () => {
    if (pageNumber < (numPages || 1)) {
      setPageNumber(pageNumber + 1);
    }
  };

  // 处理上一页
  const goToPrevPage = () => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    }
  };

  // 缩放控制
  const zoomIn = () => {
    setScale(prevScale => Math.min(prevScale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(prevScale => Math.max(prevScale - 0.2, 0.5));
  };

  // 删除选中的对象
  const deleteSelectedObjects = () => {
    if (!fabricCanvas) return;
    
    const activeObjects = fabricCanvas.getActiveObjects();
    if (activeObjects.length > 0) {
      activeObjects.forEach((obj: fabric.Object) => {
        fabricCanvas.remove(obj);
      });
      fabricCanvas.discardActiveObject();
      fabricCanvas.renderAll();
      setUnsavedChanges(true);
    } else {
      message.info('请先选择要删除的标注');
    }
  };

  // 清除所有标注
  const clearAllAnnotations = () => {
    if (!fabricCanvas) return;
    
    fabricCanvas.clear();
    setUnsavedChanges(true);
    message.success('已清除所有标注');
  };

  // 撤销最后一次操作（简化版）
  const undo = () => {
    if (!fabricCanvas) return;
    
    const objects = fabricCanvas.getObjects();
    if (objects.length > 0) {
      fabricCanvas.remove(objects[objects.length - 1]);
      setUnsavedChanges(true);
    }
  };

  // 组件卸载时处理
  useEffect(() => {
    return () => {
      if (fabricCanvas) {
        fabricCanvas.dispose();
      }
    };
  }, [fabricCanvas]);

  // 页面变化时加载新页面的标注
  useEffect(() => {
    if (fabricCanvas) {
      // 如果有未保存的更改，提示用户
      if (unsavedChanges) {
        const confirmSave = window.confirm('当前页面有未保存的标注，是否保存？');
        if (confirmSave) {
          saveAnnotations();
        }
      }
      
      // 切换页面时重新加载标注
      loadAnnotationsForPage(pageNumber);
    }
  }, [pageNumber, fabricCanvas, unsavedChanges, loadAnnotationsForPage, saveAnnotations]);

  // 处理PDF加载错误
  const handleLoadError = (error: Error) => {
    console.error('PDF加载错误:', error);
    setPdfError(error.message);
    setLoading(false);
  };

  return (
    <div className="pdf-viewer-container">
      <div className="toolbar">
        <Space>
          <Tooltip title="笔标注">
            <Button 
              type={currentTool === ToolType.PEN ? 'primary' : 'default'} 
              icon={<EditOutlined />} 
              onClick={() => setCurrentTool(ToolType.PEN)}
            />
          </Tooltip>
          <Tooltip title="荧光笔">
            <Button 
              type={currentTool === ToolType.HIGHLIGHTER ? 'primary' : 'default'} 
              icon={<HighlightOutlined />} 
              onClick={() => setCurrentTool(ToolType.HIGHLIGHTER)}
            />
          </Tooltip>
          <Tooltip title="橡皮擦">
            <Button 
              type={currentTool === ToolType.ERASER ? 'primary' : 'default'} 
              icon={<DeleteOutlined />} 
              onClick={() => setCurrentTool(ToolType.ERASER)}
            />
          </Tooltip>
          <Tooltip title="删除选中">
            <Button icon={<DeleteOutlined />} onClick={deleteSelectedObjects} />
          </Tooltip>
          <Tooltip title="撤销">
            <Button icon={<UndoOutlined />} onClick={undo} />
          </Tooltip>
          <Tooltip title="清除所有">
            <Button danger icon={<DeleteOutlined />} onClick={clearAllAnnotations} />
          </Tooltip>
          <Tooltip title="保存标注">
            <Button 
              type="primary"
              icon={<SaveOutlined />} 
              onClick={saveAnnotations}
              disabled={!unsavedChanges}
            />
          </Tooltip>
        </Space>

        <Space>
          <Tooltip title="放大">
            <Button icon={<ZoomInOutlined />} onClick={zoomIn} />
          </Tooltip>
          <Tooltip title="缩小">
            <Button icon={<ZoomOutOutlined />} onClick={zoomOut} />
          </Tooltip>
          <span className="scale-display">{Math.round(scale * 100)}%</span>
        </Space>

        <Space>
          <Tooltip title="上一页">
            <Button 
              icon={<BackwardOutlined />} 
              onClick={goToPrevPage} 
              disabled={pageNumber <= 1}
            />
          </Tooltip>
          <span className="page-display">
            {pageNumber} / {numPages || '?'}
          </span>
          <Tooltip title="下一页">
            <Button 
              icon={<ForwardOutlined />} 
              onClick={goToNextPage} 
              disabled={pageNumber >= (numPages || 1)}
            />
          </Tooltip>
        </Space>
      </div>

      <div className="document-container" ref={canvasContainerRef}>
        <Spin spinning={loading} tip="加载中...">
          {pdfError ? (
            <div className="error">
              <Alert
                type="error"
                message="文档加载失败"
                description={
                  <>
                    <p>请检查网络连接或文件格式</p>
                    <p>错误详情：{pdfError}</p>
                    <p>文件URL: {fileUrl}</p>
                    <Button onClick={() => window.location.reload()} style={{ marginTop: '10px' }}>
                      刷新页面
                    </Button>
                  </>
                }
              />
            </div>
          ) : (
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={handleLoadError}
              loading={<div className="loading">加载文档中...</div>}
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                onRenderSuccess={onPageRenderSuccess}
                renderTextLayer={false}
                renderAnnotationLayer={false}
                className="pdf-page"
              />
            </Document>
          )}
          <canvas ref={canvasRef} className="annotation-canvas" />
        </Spin>
      </div>

      <div className="pdf-status-bar">
        {unsavedChanges && <span className="unsaved-indicator">有未保存的更改</span>}
      </div>
    </div>
  );
};

export default PDFViewer; 