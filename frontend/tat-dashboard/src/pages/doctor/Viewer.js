import React, { Component, createRef } from "react";
import {
  AlertCircle,
  Clock,
  User,
  CheckCircle,
  MessageCircle,
} from "lucide-react";

import "../doctor/Viewer.css";
import { FiFile } from "react-icons/fi"; // File icon from react-icons
import html2canvas from "html2canvas";


import * as cornerstone from '@cornerstonejs/core';
import * as cornerstoneTools from '@cornerstonejs/tools';
import cornerstoneDICOMImageLoader from '@cornerstonejs/dicom-image-loader';
import { cornerstoneStreamingImageVolumeLoader, cornerstoneStreamingDynamicImageVolumeLoader } from '@cornerstonejs/streaming-image-volume-loader';
import dicomParser from 'dicom-parser';
import createImageIdsAndCacheMetaData from '../../utils/createImageIdsAndCacheMetaData';

// Toolgroup and rendering setup
const toolGroupId = "myToolGroup";
const renderingEngineId = "myRenderingEngine";
const viewportIds = ['first', 'second', 'third', 'fourth'];
const indexMap = {first: 'viewport1Index', second: 'viewport2Index', third: 'viewport3Index', fourth: 'viewport4Index'}

const Tools = {
  "Length": cornerstoneTools.LengthTool,
  "Angle": cornerstoneTools.AngleTool,
  "CobbAngle": cornerstoneTools.CobbAngleTool,
  "RectangleROI": cornerstoneTools.RectangleROITool,
  "CircleROI": cornerstoneTools.CircleROITool,
  "EllipticalROI": cornerstoneTools.EllipticalROITool,
  "FreehandROI": cornerstoneTools.PlanarFreehandROITool,
  "Bidirectional": cornerstoneTools.BidirectionalTool,
  "Zoom": cornerstoneTools.ZoomTool,
  "Pan": cornerstoneTools.PanTool,
  "Contrast": cornerstoneTools.WindowLevelTool,
  "Probe": cornerstoneTools.ProbeTool,
  "Eraser": cornerstoneTools.EraserTool,
  "PlanarRotate": cornerstoneTools.PlanarRotateTool,
  "Height": cornerstoneTools.HeightTool,
  "SplineROI": cornerstoneTools.SplineROITool,
  "StackScroll": cornerstoneTools.StackScrollMouseWheelTool,
  "ArrowAnnotate": cornerstoneTools.ArrowAnnotateTool,
  "Crosshairs": cornerstoneTools.CrosshairsTool,
  "Magnify": cornerstoneTools.MagnifyTool,
  "Wheel": cornerstoneTools.StackScrollTool,
  "ReferenceLines": cornerstoneTools.ReferenceLinesTool,
 
};

class Viewer extends Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      options_label: "DEFAULT",
      showDetails: true,
      status: "under-reporting",
      showReportEditor: false,
      studyData: null,
      cornerstoneInitialized: false,
      patientData: null,
      loading: true,
      error: null
    };
    
    this.renderingEngineRef = createRef();
    
    // Initialize instance variables
    this.toolGroup = null;
    this.renderingEngine = null;
    this.viewport_list = {};
    this.selected_viewport = null;
    this.prev_selected_element = null;
    this.nonCT_ImageIds = [];
    this.curr_tool = null;
    this.prev_layout = "one";
    this.eventListeners = [];
    this.cornerstoneProcessed = false;
    
    this.cornerstone = this.cornerstone.bind(this);
    this.drop = this.drop.bind(this);
    this.allowDrop = this.allowDrop.bind(this);
    this.toggleTool = this.toggleTool.bind(this);
    this.volumeOrientation = this.volumeOrientation.bind(this);
    this.slabThickness = this.slabThickness.bind(this);
    this.slab = this.slab.bind(this);
    this.orientationSettings = this.orientationSettings.bind(this);
    this.viewportSettings = this.viewportSettings.bind(this);
    this.layoutSettings = this.layoutSettings.bind(this);
    this.openImageInViewport = this.openImageInViewport.bind(this);
    this.toggleInvert = this.toggleInvert.bind(this);
    this.downloadAsJPEG = this.downloadAsJPEG.bind(this);
    this .capture = this.capture.bind(this);
 
  }


  // Add this new method to fetch patient data
  async fetchPatientData() {
    try {
      // Get the ID from URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const patientId = urlParams.get('id');
      
      if (!patientId) {
        throw new Error('No patient ID provided in URL');
      }

      const response = await fetch("http://localhost:8000/api/fetch-dicom/", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id: patientId })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      this.setState({ 
        patientData: data,
        loading: false 
      });

      return data;

    } catch (error) {
      console.error("Error fetching patient data:", error);
      this.setState({ 
        error: error.message,
        loading: false 
      });
      return null;
    }
  }
  

downloadAsJPEG(element) {
  const { patientData } = this.state; // get patient data from state

  if (!element) {
    console.error("No element provided to downloadAsJPEG");
    return;
  }

  // Use fallback if patientData is not yet loaded
  const patientName = (patientData && patientData.patient_name) || "unknown_patient";
  const patientId = (patientData && patientData.patient_id) || "unknown_id";

  html2canvas(element, { allowTaint: true }).then((canvas) => {
    // Convert canvas to JPEG data URL
    const jpegImageUrl = canvas.toDataURL("image/jpeg");

    // Sanitize file name
    const sanitizedPatientName = patientName.replace(/[^a-z0-9]/gi, "_").toLowerCase();
    const sanitizedPatientId = patientId.replace(/[^a-z0-9]/gi, "_").toLowerCase();

    // Trigger download
    const link = document.createElement("a");
    link.href = jpegImageUrl;
    link.download = `${sanitizedPatientId}_${sanitizedPatientName}.jpeg`;
    link.click();
  });
}

 //function to capture selected viewport and download it as image
  capture(element) {
    html2canvas(element, { allowTaint: true }).then(function (canvas) {
      // Get the base64 image URL from the canvas
      const imageUrl = canvas.toDataURL('image/png');
  
      if (window.editor) {
        window.editor.model.change(writer => {
          // Get the end position of the document root to insert the image at the end
          const root = window.editor.model.document.getRoot();
          const endPosition = writer.createPositionAt(root, 'end');
  
          // Create an image element with the captured image URL
          const imageElement = writer.createElement('image', {
            src: imageUrl,
            alt: 'Captured Screenshot'
          });
  
          // Insert the image at the end position of the document
          writer.insert(imageElement, endPosition);
        });
      } else {
        console.error("CKEditor instance not found.");
      }
    });
  }


  toggleDetails = () => {
    this.setState((prevState) => ({
      showDetails: !prevState.showDetails,
    }));
  };

  allowDrop(event) {
    event.preventDefault();
  }

  async openImageInViewport(ID, modality, targetViewportId) {
    try {
      let viewport = this.renderingEngine.getViewport(targetViewportId);
      
      // If viewport doesn't exist, enable it first
      if (!viewport) {
        const viewportConfig = this.viewport_list[targetViewportId];
        if (viewportConfig) {
          this.renderingEngine.enableElement(viewportConfig);
          viewport = this.renderingEngine.getViewport(targetViewportId);
        } else {
          console.error(`Viewport ${targetViewportId} not found in viewport_list`);
          return;
        }
      }

      if (!viewport) {
        console.error(`Viewport ${targetViewportId} is not properly initialized`);
        return;
      }

      if (viewport.type === cornerstone.Enums.ViewportType.VOLUME) {
        viewport.setVolumes([]);
      }

      if (modality === 'CT' || modality === 'MR') {
        const volume = cornerstone.cache.getVolume(ID);
        if (!volume) {
          console.error(`Volume ${ID} not found in cache`);
          return;
        }
        
        const hasMultipleSlices = volume && volume.imageIds.length > 1;

        if (hasMultipleSlices) {
          const newViewport = await cornerstone.utilities.convertStackToVolumeViewport({
            options: { volumeId: ID, viewportId: targetViewportId, orientation: cornerstone.Enums.OrientationAxis.ACQUISITION },
            viewport: viewport,
          });

          newViewport.setProperties({ rotation: 0 });
          
          if (this.toolGroup) {
            try {
              this.toolGroup.addViewport(newViewport.id, renderingEngineId);
            } catch (e) {
              // Ignore if already exists
            }
          }
          
          newViewport.render();

          const newImageListener = () => {
            const index = newViewport.getSliceIndex() + 1;
            const indexElement = document.getElementById(indexMap[newViewport.id]);
            if (indexElement) {
              indexElement.innerHTML = 'Image: ' + index;
            }
          };
          
          newViewport.element.addEventListener(cornerstone.EVENTS.VOLUME_NEW_IMAGE, newImageListener);
          this.eventListeners.push({element: newViewport.element, type: cornerstone.EVENTS.VOLUME_NEW_IMAGE, listener: newImageListener});
        } else {
          viewport.setStack(volume.imageIds);
          viewport.render();
        }
      } else {
        if (viewport.type === cornerstone.Enums.ViewportType.STACK) {
          const imageIds = this.nonCT_ImageIds[Number(ID)];
          if (imageIds) {
            viewport.setStack(imageIds);
            viewport.render();
          } else {
            console.error(`Non-CT image IDs not found for ID: ${ID}`);
          }
        } else {
          this.renderingEngine.disableElement(targetViewportId);
          let curr = this.viewport_list[targetViewportId];
          if (curr) {
            curr.type = cornerstone.Enums.ViewportType.STACK;
            delete curr.defaultOptions;

            this.renderingEngine.enableElement(curr);
            
            const newViewport = this.renderingEngine.getViewport(targetViewportId);
            if (newViewport) {
              newViewport.setProperties({ rotation: 0 });
              
              if (this.toolGroup) {
                try {
                  this.toolGroup.addViewport(newViewport.id, renderingEngineId);
                } catch (e) {
                  // Ignore if already exists
                }
              }
              
              const imageIds = this.nonCT_ImageIds[Number(ID)];
              if (imageIds) {
                newViewport.setStack(imageIds);
                newViewport.render();

                const newImageListener = () => {
                  const index = newViewport.getCurrentImageIdIndex() + 1;
                  const indexElement = document.getElementById(indexMap[newViewport.id]);
                  if (indexElement) {
                    indexElement.innerHTML = 'Image: ' + index;
                  }
                };
                
                newViewport.element.addEventListener(cornerstone.EVENTS.STACK_NEW_IMAGE, newImageListener);
                this.eventListeners.push({element: newViewport.element, type: cornerstone.EVENTS.STACK_NEW_IMAGE, listener: newImageListener});
              } else {
                console.error(`Non-CT image IDs not found for ID: ${ID}`);
              }
            }
          } else {
            console.error(`Viewport configuration not found for: ${targetViewportId}`);
          }
        }
      }
    } catch (error) {
      console.error("Error opening image in viewport:", error);
    }
  }

  drop(event) {
    event.preventDefault();

    // Get dropped item info
    const obj = JSON.parse(event.dataTransfer.getData('text'));
    const ID = obj[0];
    const modality = obj[1];
    
    // Get current viewport
    const parentElement = event.target.parentElement;
    const viewport_ID = parentElement.getAttribute('data-value');
    
    // Force a small delay to let React finish its updates
    setTimeout(() => {
      this.openImageInViewport(ID, modality, viewport_ID);
    }, 10);
  }

  async cornerstone(PARAM) {
    try {
      const previewTab = document.getElementById('previewTab');
      if (!previewTab) {
        console.error("Preview tab element not found");
        return;
      }
      
      const studyid = PARAM;

      // Create a loading message div
      const loadingMessage = document.createElement('div');
      loadingMessage.id = 'loadingMessage';
      loadingMessage.innerText = 'Please wait, images are loading...';
      loadingMessage.style.position = 'absolute';
      loadingMessage.style.top = '50%';
      loadingMessage.style.left = '50%';
      loadingMessage.style.transform = 'translate(-50%, -50%)';
      loadingMessage.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      loadingMessage.style.color = '#fff';
      loadingMessage.style.padding = '10px 20px';
      loadingMessage.style.borderRadius = '5px';
      loadingMessage.style.fontSize = '16px';
      loadingMessage.style.zIndex = '1000';
      loadingMessage.style.pointerEvents = 'none';
      document.body.appendChild(loadingMessage);

      // Timeout for the loading message - 1 minute
      const loadingMessageTimeout = setTimeout(() => {
        const message = document.getElementById('loadingMessage');
        if (message) {
          document.body.removeChild(message);
        }
      }, 60000);

      // Use the patient data from state instead of fetching again
      const { patientData } = this.state;
      
      if (!patientData) {
        throw new Error('Patient data not available');
      }

      const { study_instance_uid } = patientData;

      // Since we don't have series data from the new API, we'll need to adapt
      // For now, let's assume we need to fetch series data separately or modify the API
      // This part needs to be adjusted based on your actual data structure
      const response = await fetch("http://127.0.0.1:8000/api/serverdata/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `studyid=${encodeURIComponent(studyid)}`
      });

      if (!response.ok) throw new Error(`Server error: ${response.status}`);

      const data = await response.json();
      this.setState({ studyData: data });

      const { study_uid, series } = data;

      let k = 0;
      let imageIdIndex = 0;
      let loadedSeriesCount = 0;

      // Handle each series asynchronously
      const imagePromises = series.map(async (item, index) => {
        const startTime = Date.now();
        
        let imageId = await createImageIdsAndCacheMetaData({
          StudyInstanceUID: study_uid,
          SeriesInstanceUID: item[0],
          wadoRsRoot: 'https://pacs.reportingbot.in/dicom-web',
        });

        let imageCount = 0;
        if (Array.isArray(imageId)) {
          imageCount = imageId.length;
        }

        // Create wrapper container (card for image + text)
        const cardContainer = document.createElement('div');
        cardContainer.style.display = 'flex';
        cardContainer.style.alignItems = 'center';
        cardContainer.style.border = '2px solid #ef4444';
        cardContainer.style.borderRadius = '6px';
        cardContainer.style.padding = '6px';
        cardContainer.style.marginBottom = '8px';
        cardContainer.style.backgroundColor = '#1D1D1F';
        cardContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        cardContainer.style.cursor = 'pointer';

        // Create image
        let image = document.createElement('img');
        image.src = item[3];
        image.style.height = '80px';
        image.style.width = '100px';
        image.style.borderRadius = '4px';
        image.style.border = '1px solid #444';
        image.style.marginRight = '10px';

        // Create text container (common for both CT/MR and non-CT)
        const textContainer = document.createElement('div');
        textContainer.style.flex = '1';
        textContainer.style.color = '#f1f1f1';
        textContainer.style.fontSize = '11px';
        textContainer.style.lineHeight = '1.4';
        textContainer.innerHTML = `
          <p style="margin:0;">
            <strong>${item[1]}</strong>
          </p>
          <p style="margin:0;">${item[2]}</p>
          <p style="margin:2px 0; font-size:10px; color:#bbb;">
            Image Count: <strong>${imageCount}</strong>
          </p>
        `;

        // Process based on modality type
        if (item[1] === 'CT' || item[1] === 'MR') {
          const firstImageId = imageId[0];
          const imagePlaneMeta = cornerstone.metaData.get('imagePlaneModule', firstImageId);
          
          if (!imagePlaneMeta || !Array.isArray(imagePlaneMeta.imageOrientationPatient)) {
            cornerstone.metaData.addProvider((type, id) => {
              if (type !== 'imagePlaneModule' || id !== firstImageId) return undefined;
              return {
                ...imagePlaneMeta,
                imageOrientationPatient: [1, 0, 0, 0, 1, 0],
                imagePositionPatient: imagePlaneMeta?.imagePositionPatient || [0, 0, 0],
                rowCosines: [1, 0, 0],
                columnCosines: [0, 1, 0],
                frameOfReferenceUID: imagePlaneMeta?.frameOfReferenceUID || '1.2.840.10008.1.2.1.999999',
                rows: imagePlaneMeta?.rows || 512,
                columns: imagePlaneMeta?.columns || 512,
                pixelSpacing: imagePlaneMeta?.pixelSpacing || [1.0, 1.0],
              };
            }, 1000);
          }

          let volumeId = 'cornerstoneStreamingImageVolume: myVolume' + k;
          k += 1;
          image.dataset.value = volumeId;

          let volume = await cornerstone.volumeLoader.createAndCacheVolume(volumeId, { imageIds: imageId });
          cornerstone.utilities.cacheUtils.performCacheOptimizationForVolume(volumeId);
          volume.load();

          image.dataset.modality = item[1];
          image.dataset.description = item[2];
          image.draggable = true;

          image.addEventListener('load', () => {
            loadedSeriesCount++;
          });
        } else {
          // Non-CT/MR processing
          this.nonCT_ImageIds.push(imageId);
          image.dataset.value = imageIdIndex;
          imageIdIndex += 1;

          image.dataset.modality = item[1];
          image.dataset.description = item[2];
          image.draggable = true;
          
          image.addEventListener('load', () => {
            loadedSeriesCount++;
          });
        }

        // Add click event listener (common for both types)
        const clickListener = (event) => {
          const ID = event.target.dataset.value;
          const modality = event.target.dataset.modality;
           const targetViewportId = this.selected_viewport;
          this.openImageInViewport(ID, modality, targetViewportId);
        };
        
        image.addEventListener('click', clickListener);
        this.eventListeners.push({element: image, type: 'click', listener: clickListener});

        // Append children to card container (ONCE for both types)
        cardContainer.appendChild(image);
        cardContainer.appendChild(textContainer);

        // Add the card to preview tab (SINGLE APPEND POINT)
        previewTab.appendChild(cardContainer);

        const endTime = Date.now();
        const elapsedTime = endTime - startTime;
        console.log(`Series ${index + 1} (modality: ${item[1]}): Load Time = ${elapsedTime} ms`);
        return item;
      });

      // Once all promises are resolved, proceed to cleanup
      Promise.all(imagePromises)
        .then(() => {
          clearTimeout(loadingMessageTimeout);
          const message = document.getElementById('loadingMessage');
          if (message) {
            document.body.removeChild(message);
          }
          const firstImage = previewTab.querySelector('img');
          if (firstImage) {
            const ID = firstImage.dataset.value;
            const modality = firstImage.dataset.modality;
            const targetViewportId = viewportIds[0];
            this.openImageInViewport(ID, modality, targetViewportId);
          }
        })
        .catch(error => {
          clearTimeout(loadingMessageTimeout);
          const message = document.getElementById('loadingMessage');
          if (message) {
            document.body.removeChild(message);
          }
          console.error('Error while loading images:', error);
        });

      const dragStartListener = (event) => {
        if (event.target.tagName === 'IMG') {
          const transferData = [event.target.dataset.value, event.target.dataset.modality, event.target.dataset.description];
          event.dataTransfer.setData("text", JSON.stringify(transferData));
        }
      };
      
      previewTab.addEventListener('dragstart', dragStartListener);
      this.eventListeners.push({element: previewTab, type: 'dragstart', listener: dragStartListener});

    } catch (error) {
      console.error(error);
      const message = document.getElementById('loadingMessage');
      if (message) {
        document.body.removeChild(message);
      }
    }
  }

  async initializeCornerstone() {
    if (this.state.cornerstoneInitialized) return;
    
    await cornerstone.init();
    cornerstoneTools.init();
    
    // Add metadata providers
    cornerstone.metaData.addProvider(
      cornerstone.utilities.calibratedPixelSpacingMetadataProvider.get.bind(
        cornerstone.utilities.calibratedPixelSpacingMetadataProvider
      ),
      11000
    );

    cornerstone.metaData.addProvider(
      cornerstone.utilities.genericMetadataProvider.get.bind(
        cornerstone.utilities.genericMetadataProvider
      ),
      10000
    );

    const { preferSizeOverAccuracy, useNorm16Texture } =
      cornerstone.getConfiguration().rendering;

      window.cornerstone = cornerstone;
      window.cornerstoneTools = cornerstoneTools;
    // Register volume loaders
    cornerstone.volumeLoader.registerVolumeLoader(
      "cornerstoneStreamingImageVolume",
      cornerstoneStreamingImageVolumeLoader
    );
    cornerstone.volumeLoader.registerUnknownVolumeLoader(
      cornerstoneStreamingImageVolumeLoader
    );
    cornerstone.volumeLoader.registerVolumeLoader(
      "cornerstoneStreamingDynamicImageVolume",
      cornerstoneStreamingDynamicImageVolumeLoader
    );

    // Configure DICOM image loader
    cornerstoneDICOMImageLoader.external.cornerstone = cornerstone;
    cornerstoneDICOMImageLoader.external.dicomParser = dicomParser;
    cornerstoneDICOMImageLoader.configure({
      useWebWorkers: true,
      decodeConfig: {
        convertFloatPixelDataToInt: false,
        use16BitDataType: preferSizeOverAccuracy || useNorm16Texture,
      },
    });

    let maxWebWorkers = 1;
    if (navigator.hardwareConcurrency) {
      maxWebWorkers = Math.min(navigator.hardwareConcurrency, 10);
    }

    // Web worker settings
    const config = {
      maxWebWorkers,
      startWebWorkersOnDemand: false,
      taskConfiguration: {
        decodeTask: {
          initializeCodecsOnStartup: false,
          strict: false,
        },
      },
    };

    cornerstoneDICOMImageLoader.webWorkerManager.initialize(config);
    
    this.setState({ cornerstoneInitialized: true });
  }

async componentDidMount() {
    try {
      // Fetch patient data first
      const patientData = await this.fetchPatientData();
      
      if (!patientData) {
        console.error("Failed to fetch patient data");
        return;
      }
      console.log("Patient Data:", patientData);

      await this.initializeCornerstone();
      
      // Use study_id from patient data instead of hardcoded value
      const studyid = patientData.study_id || "3c475322-dd16d05c-ceaf7688-4d64be59-57de70f0";

      // Setting cache size
      
       cornerstone.cache.setMaxCacheSize(3 * 1024 * 1024 * 1024); // 3 GB safe for most systems
    cornerstone.setUseSharedArrayBuffer(false);
      
      const elements = [
        document.getElementById('viewport1'), 
        document.getElementById('viewport2'), 
        document.getElementById('viewport3'), 
        document.getElementById('viewport4')
      ];
      
      // Create rendering engine if it doesn't exist
      if (!this.renderingEngine) {
        this.renderingEngine = new cornerstone.RenderingEngine(renderingEngineId);
      }

      // Check if tool group already exists
      this.toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
      if (!this.toolGroup) {
        // Create tool groups for storing all tools
        this.toolGroup = cornerstoneTools.ToolGroupManager.createToolGroup(toolGroupId);

         for (const [key, value] of Object.entries(Tools)){
                cornerstoneTools.addTool(value);
                this.toolGroup.addTool(value.toolName);
              }
        
        // Enable tools
        this.toolGroup.setToolConfiguration(cornerstoneTools.StackScrollTool.toolName, {
          bindings: [
            {
              mouseButton: cornerstoneTools.Enums.MouseBindings.Primary,
            },
          ],
        });

        // Set scroll active
        this.toolGroup.setToolActive(cornerstoneTools.StackScrollMouseWheelTool.toolName);
        this.toolGroup.setToolConfiguration(cornerstoneTools.CrosshairsTool.toolName, {
          bindings: [
            {
              mouseButton: cornerstoneTools.Enums.MouseBindings.Primary,
            },
          ],
        });
        
        this.toolGroup.setToolConfiguration(cornerstoneTools.PlanarFreehandROITool.toolName, {
          calculateStats: true
        });
        this.toolGroup.setToolConfiguration(cornerstoneTools.HeightTool.toolName, {
          calculateStats: true
        });
      }
      
      // Define 4 stack viewports with viewport id, viewport type, DOM element to be used
      const first_viewport = {
        viewportId: viewportIds[0],
        type: cornerstone.Enums.ViewportType.STACK,
        element: elements[0],
      };

      const second_viewport = {
        viewportId: viewportIds[1],
        type: cornerstone.Enums.ViewportType.STACK,
        element: elements[1],
      };

      const third_viewport = {
        viewportId: viewportIds[2],
        type: cornerstone.Enums.ViewportType.STACK,
        element: elements[2],
      };
      
      const fourth_viewport = {
        viewportId: viewportIds[3],
        type: cornerstone.Enums.ViewportType.STACK,
        element: elements[3],
      };

      this.viewport_list = {
        first: first_viewport, 
        second: second_viewport, 
        third: third_viewport, 
        fourth: fourth_viewport
      };

      // Enable first_viewport, make it the previously selected viewport, set its properties, add the toolgroup
      this.renderingEngine.enableElement(first_viewport);
      this.selected_viewport = viewportIds[0];
      this.prev_selected_element = elements[0];

      const viewport = this.renderingEngine.getViewport(this.selected_viewport);
      viewport.setProperties({rotation: 0});
      
      // Add viewport to toolgroup if not already added
      this.toolGroup.addViewport(viewportIds[0], renderingEngineId);

      // Function to cache images and metadata, create volumes if needed
      if (!this.cornerstoneProcessed) {
        this.cornerstoneProcessed = true;
        this.cornerstone(studyid);
      }

      // Event listeners for viewports
      elements.forEach((item, i) => {
        // Initial event listener for stack viewport to capture image index
        const stackNewImageListener = function() {
          let currViewport = this.renderingEngine.getViewport(viewportIds[i]);
          let index = currViewport.getCurrentImageIdIndex() + 1;

          // Update image index
          let indexElem = document.getElementById(indexMap[currViewport.id]);
          if (indexElem) {
            indexElem.innerHTML = index;
          }
        }.bind(this);
        
        item.addEventListener(cornerstone.EVENTS.STACK_NEW_IMAGE, stackNewImageListener);
        this.eventListeners.push({element: item, type: cornerstone.EVENTS.STACK_NEW_IMAGE, listener: stackNewImageListener});

        const clickListener = function() {
          // Get clicked viewport ID
          const clickedViewportId = viewportIds[i];
        
          if (this.selected_viewport !== clickedViewportId) {
            // Update selected viewport
            this.selected_viewport = clickedViewportId;
        
            // Reset border style
            if (this.prev_selected_element) {
              this.prev_selected_element.style.borderColor = 'white';
            }
            item.style.borderColor = 'red';
            this.prev_selected_element = item;
        
            // Dynamically update reference lines config
            const targetViewports = viewportIds.filter(id => id !== this.selected_viewport);
        
            this.toolGroup.setToolConfiguration(cornerstoneTools.ReferenceLinesTool.toolName, {
              sourceViewportId: this.selected_viewport,
              targetViewportIds: targetViewports,
            });
        
            // Force render update
            this.renderingEngine.render();
          }
        }.bind(this);
        
        item.addEventListener('click', clickListener);
        this.eventListeners.push({element: item, type: 'click', listener: clickListener});
      });

    } catch (error) {
      console.error("Error in componentDidMount:", error);
      this.setState({ 
        error: error.message,
        loading: false 
      });
    }
  }


  toggleTool(newTool) {
    if (!this.toolGroup) {
      console.error("Tool group not initialized");
      return;
    }
    
    const tool = Tools[newTool]?.toolName;
    if (!tool) {
      console.error(`Tool ${newTool} not found`);
      return;
    }
    
    if (this.curr_tool != null) {
      this.toolGroup.setToolPassive(this.curr_tool);
    }
    
    this.toolGroup.setToolActive(tool, {
      bindings: [
        {
          mouseButton: cornerstoneTools.Enums.MouseBindings.Primary,
        },
      ],
    });
    
    this.curr_tool = tool;
  }

  volumeOrientation(event, id) {
    if (!this.renderingEngine) {
      console.error("Rendering engine not initialized");
      return;
    }
    
    const call = event.target.value;
    const viewport = this.renderingEngine.getViewport(id);
    
    if (!viewport) {
      console.error(`Viewport ${id} not found`);
      return;
    }
    
    switch(call) {
      case 'axial':
        viewport.setOrientation(cornerstone.Enums.OrientationAxis.AXIAL);
        break;
      
      case 'sagittal':
        viewport.setOrientation(cornerstone.Enums.OrientationAxis.SAGITTAL);
        break;
      
      case 'coronal':
        viewport.setOrientation(cornerstone.Enums.OrientationAxis.CORONAL);
        break;
    }
    
    event.target.value = '';
  }

  slabThickness(val, id) {
    if (!this.renderingEngine) {
      console.error("Rendering engine not initialized");
      return;
    }
    
    const viewport = this.renderingEngine.getViewport(id);
    if (!viewport) {
      console.error("MIP: Viewport not found!");
      return;
    }
    
    viewport.setBlendMode(cornerstone.Enums.BlendModes.MAXIMUM_INTENSITY_BLEND);
    viewport.setProperties({ slabThickness: Number(val) });
    viewport.render();
  }
  
  slab(val, id) {
    if (!this.renderingEngine) {
      console.error("Rendering engine not initialized");
      return;
    }
    
    const viewport = this.renderingEngine.getViewport(id);
    if (!viewport) {
      console.error("MinIP: Viewport not found!");
      return;
    }
  
    viewport.setBlendMode(cornerstone.Enums.BlendModes.MINIMUM_INTENSITY_BLEND);
    viewport.setProperties({ slabThickness: Number(val) });
    viewport.render();
  }
  
  orientationSettings(event, id) {
    if (!this.renderingEngine) {
      console.error("Rendering engine not initialized");
      return;
    }
    
    const call = event.target.value;
    const viewport = this.renderingEngine.getViewport(id);
    
    if (!viewport) {
      console.error(`Viewport ${id} not found`);
      return;
    }
    
    const { rotation } = viewport.getProperties();
    
    switch(call) {
      case 'Rleft':
        viewport.setProperties({rotation: rotation - 90});
        break; 
  
      case 'Rright':
        viewport.setProperties({rotation: rotation + 90});
        break;
  
      case 'Hflip':
        const { flipHorizontal } = viewport.getCamera();
        viewport.setCamera({ flipHorizontal: !flipHorizontal });
        break;
  
      case 'Vflip':
        const { flipVertical } = viewport.getCamera();
        viewport.setCamera({ flipVertical: !flipVertical });
        break;
    }
    
    viewport.render();
    event.target.value = '';
  }
  
  viewportSettings(call, id) { 
    if (!this.renderingEngine) {
      console.error("Rendering engine not initialized");
      return;
    }
    
    const viewport = this.renderingEngine.getViewport(id);
    
    if (!viewport) {
      console.error(`Viewport ${id} not found`);
      return;
    }
    
    switch (call) {
      case 'Reset':
        viewport.resetCamera();
        viewport.resetProperties();
        
        if (Tools["Length"]) {
          this.toolGroup.setToolDisabled(Tools["Length"].toolName);
        }
        break;
    }
    
    viewport.render();
  }

  layoutSettings(event) {
    const call = event.target.value;
    const container = document.querySelector('.viewport-div');

    const viewport2 = document.getElementById('viewport2');
    const viewport3 = document.getElementById('viewport3');
    const viewport4 = document.getElementById('viewport4');
    
    if (!this.prev_layout) {
      this.prev_layout = 'one';
    }
  
    switch (call) {
      case 'one':
        console.log('Switching to 1x1 layout (one)');
        if (this.prev_layout == 'four') {
          console.log('Transitioning from 4 to 1 layout');
          this.renderingEngine.disableElement(viewportIds[1]);
          this.renderingEngine.disableElement(viewportIds[2]);
          this.renderingEngine.disableElement(viewportIds[3]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[2]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[3]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[1]);

          viewport2.style.display = 'none';
          viewport3.style.display = 'none';
          viewport4.style.display = 'none';
        } else if (this.prev_layout == 'three') {
          console.log('Transitioning from 3 to 1 layout');
          this.renderingEngine.disableElement(viewportIds[1]);
          this.renderingEngine.disableElement(viewportIds[2]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[1]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[2]);
  
          viewport2.style.display = 'none';
          viewport3.style.display = 'none';
        } else if (this.prev_layout == "two") {
          this.renderingEngine.disableElement(viewportIds[1]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[1]);
          viewport2.style.display = 'none';
        }
        
        container.style.gridTemplateColumns = 'none';
        container.style.gridTemplateRows = 'none';
        break;
  
      case 'two':
        console.log('Switching to 2x1 layout');
        if (this.prev_layout == 'four') {
          console.log('Transitioning from 4 to 2 layout');
          this.renderingEngine.disableElement(viewportIds[2]);
          this.renderingEngine.disableElement(viewportIds[3]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[2]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[3]);
  
          viewport3.style.display = 'none';
          viewport4.style.display = 'none';
        }
        else if(this.prev_layout == "three") {
          this.renderingEngine.disableElement(viewportIds[2]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[2]);
          viewport3.style.display = 'none';
        }
         else {
          console.log('Enabling viewport 2');
          this.renderingEngine.enableElement(this.viewport_list.second);
          this.toolGroup.addViewport(viewportIds[1], renderingEngineId);
          viewport2.style.display = 'block';
        }
  
        container.style.gridTemplateColumns = '50% 50%';
        container.style.gridTemplateRows = 'none';
        break;
  
      case 'three':
        console.log('Switching to 1x3 layout');
        if (this.prev_layout == 'four') {
          console.log('Transitioning from 4 to 3 layout');
          this.renderingEngine.disableElement(viewportIds[3]);
          this.toolGroup.removeViewports(renderingEngineId, viewportIds[3]);
  
          viewport4.style.display = 'none';
        } else {
          console.log('Enabling viewports 2 and 3');
          this.renderingEngine.enableElement(this.viewport_list.second);
          this.renderingEngine.enableElement(this.viewport_list.third);
          this.toolGroup.addViewport(viewportIds[1], renderingEngineId);
          this.toolGroup.addViewport(viewportIds[2], renderingEngineId);
  
          viewport2.style.display = 'block';
          viewport3.style.display = 'block';
        }
  
        container.style.gridTemplateColumns = '33.33% 33.33% 33.33%';
        container.style.gridTemplateRows = 'none';
        break;
  
      case 'four':
        console.log('Switching to 2x2 layout');
        if (this.prev_layout == 'one') {
          console.log('Transitioning from 1 to 4 layout');
          this.renderingEngine.enableElement(this.viewport_list.second);
          viewport2.style.display = 'block';
          this.toolGroup.addViewport(viewportIds[1], renderingEngineId);
        }
  
        console.log('Enabling viewports 3 and 4');
        this.renderingEngine.enableElement(this.viewport_list.third);
        this.renderingEngine.enableElement(this.viewport_list.fourth);
        this.toolGroup.addViewport(viewportIds[2], renderingEngineId);
        this.toolGroup.addViewport(viewportIds[3], renderingEngineId);
        viewport3.style.display = 'block';
        viewport4.style.display = 'block';
  
        container.style.gridTemplateColumns = '50% 50%';
        container.style.gridTemplateRows = '50% 50%';
        break;
    }
  
    this.renderingEngine.resize(true, false);
    this.prev_layout = call;
    event.target.value = '';
  }

  



  toggleInvert() {
  if (!this.renderingEngine || !this.selected_viewport) {
    console.error("Rendering engine or viewport not ready");
    return;
  }

  // Get the active viewport
  const viewport = this.renderingEngine.getViewport(this.selected_viewport);
  if (!viewport) {
    console.error("Viewport not found:", this.selected_viewport);
    return;
  }

  // Toggle invert property
  const properties = viewport.getProperties();
  const newInvertState = !properties.invert;

  viewport.setProperties({
    invert: newInvertState
  });

  // Re-render the viewport
  viewport.render();

  console.log(
    `Image inversion ${newInvertState ? "enabled (black↔white)" : "disabled (normal)"}`
  );
}


  generateReport = () => {
    this.setState({
      status: "reported",
      showReportEditor: true,
    });
  };


  componentWillUnmount() {
    console.log("Component unmounting - cleaning up resources");
    
    // Cleanup all event listeners
    this.eventListeners.forEach(({element, type, listener}) => {
      if (element && element.removeEventListener) {
        try {
          element.removeEventListener(type, listener);
        } catch (e) {
          console.warn("Error removing event listener:", e);
        }
      }
    });
    this.eventListeners = [];
    
    // Terminate web workers first
    if (cornerstoneDICOMImageLoader && cornerstoneDICOMImageLoader.webWorkerManager) {
      try {
        cornerstoneDICOMImageLoader.webWorkerManager.terminate();
      } catch (e) {
        console.warn("Error terminating web workers:", e);
      }
    }
    
    // Destroy tool groups
    if (cornerstoneTools && cornerstoneTools.ToolGroupManager) {
      try {
        const toolGroup = cornerstoneTools.ToolGroupManager.getToolGroup(toolGroupId);
        if (toolGroup) {
          toolGroup.destroy();
        }
        cornerstoneTools.ToolGroupManager.destroy();
      } catch (e) {
        console.warn("Error destroying tool groups:", e);
      }
    }
    
    // Destroy rendering engine
    if (this.renderingEngine) {
      try {
        this.renderingEngine.destroy();
        this.renderingEngine = null;
      } catch (e) {
        console.warn("Error destroying rendering engine:", e);
      }
    }
    
    // Destroy tools
    if (cornerstoneTools) {
      try {
        cornerstoneTools.destroy();
      } catch (e) {
        console.warn("Error destroying tools:", e);
      }
    }
    
    // Clean up volumes carefully
    if (cornerstone && cornerstone.cache) {
      try {
        // First, remove all volumes from viewports to detach them
        if (this.renderingEngine) {
          viewportIds.forEach(viewportId => {
            try {
              const viewport = this.renderingEngine.getViewport(viewportId);
              if (viewport && viewport.setVolumes) {
                viewport.setVolumes([]);
              }
            } catch (e) {
              console.warn(`Error clearing viewport ${viewportId}:`, e);
            }
          });
        }
        
        // Then purge the cache
        cornerstone.cache.purgeCache();
        
      } catch (e) {
        console.warn("Error during cache cleanup:", e);
      }
    }
    
    // Reset instance variables
    this.toolGroup = null;
    this.renderingEngine = null;
    this.viewport_list = {};
    this.selected_viewport = null;
    this.prev_selected_element = null;
    this.nonCT_ImageIds = [];
    this.curr_tool = null;
    this.prev_layout = "one";
    this.cornerstoneProcessed = false;
    
    // Reset cornerstone initialized state
    this.setState({ cornerstoneInitialized: false });
    
    console.log("Cleanup completed");
  }

  render() {
    const { showDetails, status, showReportEditor, patientData, loading, error } = this.state;

    // Show loading state
    if (loading) {
      return (
        <div className="body">
          <div className="page-content">
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading patient data...</p>
            </div>
          </div>
        </div>
      );
    }

    // Show error state
    if (error) {
      return (
        <div className="body">
          <div className="page-content">
            <div className="error-container">
              <AlertCircle className="error-icon" size={48} />
              <h2>Error Loading Patient Data</h2>
              <p>{error}</p>
              <button onClick={() => window.location.reload()} className="retry-btn">
                Retry
              </button>
            </div>
          </div>
        </div>
      );
    }

    // Use patient data from API or fallback to defaults
    const patientName = patientData?.patient_name || "Patient Name";
    const patientId = patientData?.patient_id || "MRN-XXXX-XXXX";
    const age = patientData?.age || "Age";
    const gender = patientData?.gender || "Gender";
    const studyDate = patientData?.study_date || "2024-01-15";

    return (
      <div className="body">
        <div className="page-content">
          {/* Sidebar */}
          <div className="viewer-sidebar">
            <h1 className="viewer-title">
              <span className="white-text">U</span>
              <span className="red-text">4</span>
              <span className="white-text">RAD</span>
              <span className="white-text">&nbsp;reporting platform</span>
            </h1>

<div className="user-info" onClick={this.toggleDetails}>
  <div className="user-avatar">
    <User size={20} />
  </div>
  <div>
    <h2 className="user-name">{patientName}</h2>
    <p className="user-detail">
      <span className="user-mrn">MRN: {patientId}</span> |{" "}
      Age: <span className="white-text">{age} {gender}</span> |{" "}
      Study: <span className="white-text">{studyDate}</span>
    </p>
  </div>
</div>

{showDetails && (
  <div className="history-notes">
    {/* Notes */}
    {patientData?.notes && (
      <div className="history-content">
        <h3>Notes</h3>
        <p className="history-text">{patientData.notes}</p>
      </div>
    )}

    {/* History Files */}
    {patientData?.history_files?.length > 0 && (
      <div className="history-content">
        <h3>History Files</h3>
        {patientData.history_files.map((file, index) => (
          <p key={index} className="history-text flex items-center gap-2">
            <FiFile size={16} /> {/* File icon */}
            <a href={file} target="_blank" rel="noopener noreferrer">
              {file.split("/").pop()}
            </a>
          </p>
        ))}
      </div>
    )}

    {/* Patient Reports */}
    <div className="history-content">
      <h3>Reports</h3>
      {patientData?.patient_reports?.length > 0 ? (
        patientData.patient_reports.map((report, index) => (
          <div key={index} className="history-item flex items-center gap-2">
            <FiFile size={16} /> {/* File icon */}
            <div>
              <p className="history-date">
                Report Date:{" "}
                <span className="white-text">
                  {new Date(report.uploaded_at).toLocaleDateString()}
                </span>
              </p>
              <p className="history-text">{report.report_title}</p>
              <a
                href={report.report_file}
                target="_blank"
                rel="noopener noreferrer"
                className="history-link"
              >
                View Report
              </a>
            </div>
          </div>
        ))
      ) : (
        <p className="history-text">No previous reports available</p>
      )}
    </div>
  </div>
)}
            

            <div className="images-section">
              <div className="images-header">
                <h3>Images</h3>
                <span className="images-count">
                  {patientData?.modality ? `${patientData.modality} Study` : 'Study'}
                </span>
              </div>
              <div className="previewTab" id="previewTab"></div>
            </div>
          </div>

          {/* Rest of the component remains the same */}
          {/* Cornerstone Viewer */}
          <div className="cornerstone-container">
            <div className="viewer-container">
              <div className="status-bar">
                <div className="status-items">
                  <div className="status-item">
                    {["under-reporting", "reported"].includes(status) ? (
                      <CheckCircle className="icon green" />
                    ) : (
                      <div className="dot green pulse"></div>
                    )}
                    <span className={`status-text ${
                      ["under-reporting", "reported"].includes(status)
                        ? "green"
                        : "gray"
                    }`}>Viewing</span>
                  </div>

                  <div className="divider"></div>

                  <div className="status-item">
                    {status === "reported" ? (
                      <CheckCircle className="icon green" />
                    ) : status === "under-reporting" ? (
                      <div className="dot yellow pulse"></div>
                    ) : (
                      <div className="dot gray"></div>
                    )}
                    <span className={`status-text ${
                      status === "under-reporting"
                        ? "yellow"
                        : status === "reported"
                        ? "green"
                        : "gray"
                    }`}>Under-reporting</span>
                  </div>

                  <div className="divider"></div>

                  <div className="status-item">
                    {status === "reported" ? (
                      <div className="dot yellow pulse"></div>
                    ) : (
                      <div className="dot gray"></div>
                    )}
                    <span className="status-text yellow">Reported</span>
                  </div>
                </div>

                <div className="actions">
                  <div className="tat">
                    <Clock className="clock-icon" />
                    <span className="tat-time">00:38:59</span> TAT
                  </div>
                  <button
                    onClick={this.generateReport}
                    className="generate-btn"
                  >
                    Generate Report
                  </button>
                </div>
              </div>

              <div className="toolbar">

                <button
                  className="tool-btn"
                  value="Zoom"
                  onClick={(e) => this.toggleTool(e.target.value)}
                >
                  Zoom
                </button>
                <button className='tool-btn' value='Length' onClick={e => this.toggleTool(e.target.value)}>
                  📐 Measure
                </button>
                <button className='tool-btn' value='Eraser' onClick={e => this.toggleTool(e.target.value)}>
                  Eraser
                </button>
                <button className='tool-btn' value='Contrast' onClick={e => this.toggleTool(e.target.value)}>
                  Windowing
                </button>

                <select
                  id="measurement"
                  className="tool-btn measurement-dropdown"
                  onChange={(e) => {
                    this.toggleTool(e.target.value);
                    e.target.selectedIndex = 0;
                  }}
                >
                  <option value="" disabled defaultValue hidden>Measurement ▼</option>
                  <option value="Angle">Angle</option>
                  <option value="CobbAngle">Cobb Angle</option>
                  <option value="RectangleROI">Rectangle ROI</option>
                  <option value="CircleROI">Circle ROI</option>
                  <option value="EllipticalROI">Elliptical ROI</option>
                  <option value="FreehandROI">Freehand ROI</option>
                  <option value="SplineROI">Spline ROI</option>
                  <option value="Bidirectional">Bidirectional</option>
                  <option value="ArrowAnnotate">Arrow Annotate</option>
                </select>
                
                <select
                  id="mpr"
                  className="tool-btn measurement-dropdown"
                  onChange={(e) => {
                    this.volumeOrientation(e, this.selected_viewport);
                    e.target.selectedIndex = 0;
                  }}
                >
                  <option value="" disabled defaultValue hidden>MPR ▼</option>
                  <option value="axial">Axial</option>
                  <option value="sagittal">Sagittal</option>
                  <option value="coronal">Coronal</option>
                </select>
  
<select
  id="orientation"
  className="tool-btn measurement-dropdown"
  defaultValue="" // 👈 this replaces `selected`
  onChange={e => this.orientationSettings(e, this.selected_viewport)}
>
  <option value="" disabled hidden>
    orientation
  </option>
  <option value="Rleft">Rotate Left</option>
  <option value="Rright">Rotate Right</option>
  <option value="Hflip">Horizontal Flip</option>
  <option value="Vflip">Vertical Flip</option>
</select>

                <select
                  id="layout"
                  className="tool-btn measurement-dropdown"
                  onChange={(e) => {
                    this.layoutSettings(e);
                    e.target.selectedIndex = 0;
                  }}
                >
                  <option value="" disabled defaultValue hidden>
                    Layout ▼
                  </option>
                  <option value="one">1x1</option>
                  <option value="two">1x2</option>
                  <option value="three">1x3</option>
                  <option value="four">2x2</option>
                </select>

<select
  id="measurement"
  className="tool-btn measurement-dropdown"
  defaultValue="" // placeholder
  onChange={(e) => {
    const value = e.target.value;
    if (value === "Reset") {
      this.viewportSettings("Reset", this.selected_viewport);
    } else if (value === "Invert") {
      this.toggleInvert();
    } else if (value === "Download") {
    
    
        this.downloadAsJPEG(this.prev_selected_element);
      
    } else if (value === "capture") {
      this.capture(this.prev_selected_element);
    }
     else {
      this.toggleTool(value);
    }
    e.target.selectedIndex = 0; // reset dropdown
  }}
>
  <option value="" disabled hidden>
    More Tools ▼
  </option>
  <option value="Probe">🔍 Pixel Value</option>
  <option value="Crosshairs">➕ Crosshairs</option>
  <option value="Reset">↩️ Reset</option>
  <option value="Wheel">🖱️ Stack Scroll</option>
  <option value="Wwwc">☀️ Window Level</option>
  <option value="Pan">✋ Pan</option>
  <option value="Magnify">🔎 Magnify</option>
  <option value="Invert">🌓 Invert</option>
  <option value="Download">📸 Download JPEG</option>
  <option value="capture">📷 Capture Viewport</option>
</select>
<button
  className="tool-btn"
  onClick={() => {
    const studyInstanceUID =
         (patientData && patientData.study_instance_uid ) || "unknown";
    if (studyInstanceUID) {
      const ohifUrl = `https://pacs.reportingbot.in/ohif/viewer?StudyInstanceUIDs=${studyInstanceUID}`;
      window.open(ohifUrl, "_blank");
    }
  }}
>
  ohif
</button>




              </div>
            </div>

            <div className="viewport-div">
              <div className="viewport" id='viewport1' data-value='first' onDragOver={e => this.allowDrop(e)} onDrop={e => this.drop(e)}></div>
              <div className="viewport" id='viewport2' data-value='second' onDragOver={e => this.allowDrop(e)} onDrop={e => this.drop(e)}></div>
              <div className="viewport" id='viewport3' data-value='third' onDragOver={e => this.allowDrop(e)} onDrop={e => this.drop(e)}></div>
              <div className="viewport" id='viewport4' data-value='fourth' onDragOver={e => this.allowDrop(e)} onDrop={e => this.drop(e)}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Viewer;