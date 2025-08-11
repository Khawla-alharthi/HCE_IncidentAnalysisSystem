import { Component, AfterViewInit } from '@angular/core';
import { of, delay, firstValueFrom } from 'rxjs'; // used to simulate async API call
import * as go from 'gojs';


// Interface for tree node data
interface TreeNodeData {
  key: number;
  name: string;
  parent?: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  templateUrl: './app.html',
  styleUrls: ['./app.css']
})


export class App implements AfterViewInit {
  // User inputs bound to form fields
  incident: string = '';
  level: number | null = null;

  // GoJS diagram instance
  private diagram!: go.Diagram;

  // Flags to track if diagram is initialized and if loading is in progress
  diagramInitialized = false;
  isLoading = false;

  constructor() {}

  // Initialize the GoJS diagram after the view is loaded
  ngAfterViewInit() {
    const $ = go.GraphObject.make;

    // Create a new Diagram attached to the 'incidentChart' HTML element
    this.diagram = $(go.Diagram, 'incidentChart', {
      initialAutoScale: go.Diagram.UniformToFill, // auto-scale to fit the div
      layout: $(go.TreeLayout, {
        angle: 90,           // tree flows vertically top-to-bottom
        layerSpacing: 35,    // space between layers
      }),
    });

    // Define the template for nodes: a light blue rectangle with bold text
    this.diagram.nodeTemplate = $(
      go.Node,
      'Auto',
      $(go.Shape, 'Rectangle', { fill: 'lightblue', strokeWidth: 0 }),
      $(go.TextBlock, { margin: 8, font: 'bold 14px sans-serif' }, new go.Binding('text', 'name'))
    );

    // Define the template for links: orthogonal routing with arrowheads
    this.diagram.linkTemplate = $(
      go.Link,
      { routing: go.Link.Orthogonal, corner: 5 },
      $(go.Shape, { strokeWidth: 2, stroke: '#555' }),
      $(go.Shape, { toArrow: 'Standard', stroke: null })
    );

    // Set up form event listener
    this.setupFormHandlers();
  }

  // Setup form event handlers
  private setupFormHandlers() {
    const form = document.getElementById('incidentForm') as HTMLFormElement;
    const incidentInput = document.getElementById('incidentInput') as HTMLTextAreaElement;
    const levelInput = document.getElementById('levelInput') as HTMLInputElement;
    const exportBtn = document.getElementById('exportPdfBtn') as HTMLButtonElement;
    const loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
    const chartSection = document.getElementById('chartSection') as HTMLDivElement;

    // Handle form submission
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      this.incident = incidentInput.value.trim();
      this.level = parseInt(levelInput.value);
      
      await this.generateDiagram();
    });

    // Handle export button click
    exportBtn.addEventListener('click', () => {
      this.printDiagram();
    });

    // Initially hide loading spinner
    loadingSpinner.style.display = 'none';
  }

  // Called when user clicks "Generate Diagram"
  async generateDiagram() {
    if (!this.incident || this.level === null || isNaN(this.level)) {
      alert('Please fill in both Incident and Level');
      return;
    }

    const loadingSpinner = document.getElementById('loadingSpinner') as HTMLDivElement;
    const chartSection = document.getElementById('chartSection') as HTMLDivElement;
    const exportBtn = document.getElementById('exportPdfBtn') as HTMLButtonElement;

    this.isLoading = true;
    loadingSpinner.style.display = 'block';
    chartSection.style.display = 'none';
    exportBtn.disabled = true;

    try {
      // Use firstValueFrom to convert Observable to Promise and await the data
      const data = await firstValueFrom(this.fakeApiCall(this.incident, this.level));

      // Now 'data' is the array, which can be passed to TreeModel constructor
      this.diagram.model = new go.TreeModel(data ?? []);
      this.diagramInitialized = true;
      
      // Show chart section and enable export button
      chartSection.style.display = 'block';
      exportBtn.disabled = false;
    } catch (err) {
      alert('Failed to load diagram data');
      console.error(err);
    } finally {
      this.isLoading = false;
      loadingSpinner.style.display = 'none';
    }
  }

  /**
   * Fake API method to simulate fetching cause-effect data
   * based on incident and level.
   * Returns an Observable that emits mock data after a delay.
   */
  fakeApiCall(incident: string, level: number) {
    // Enhanced mock data for different levels and incidents
    const mockDataMap: Record<string, TreeNodeData[]> = {
      'fire-1': [
        { key: 1, name: 'Fire Incident' },
        { key: 2, parent: 1, name: 'Cause: Electrical Short' },
        { key: 3, parent: 1, name: 'Effect: Property Damage' }
      ],
      'fire-2': [
        { key: 1, name: 'Fire Incident' },
        { key: 2, parent: 1, name: 'Cause: Electrical Short' },
        { key: 3, parent: 1, name: 'Cause: Human Error' },
        { key: 4, parent: 2, name: 'Old Wiring System' },
        { key: 5, parent: 3, name: 'Lack of Training' },
        { key: 6, parent: 1, name: 'Effect: Property Damage' },
        { key: 7, parent: 1, name: 'Effect: Business Interruption' }
      ],
      'fire-3': [
        { key: 1, name: 'Fire Incident' },
        { key: 2, parent: 1, name: 'Cause: Electrical Short' },
        { key: 3, parent: 1, name: 'Cause: Human Error' },
        { key: 4, parent: 1, name: 'Cause: Poor Maintenance' },
        { key: 5, parent: 2, name: 'Overloaded Circuit' },
        { key: 6, parent: 2, name: 'Faulty Equipment' },
        { key: 7, parent: 3, name: 'Inadequate Training' },
        { key: 8, parent: 3, name: 'Safety Protocol Violation' },
        { key: 9, parent: 1, name: 'Effect: Property Damage' },
        { key: 10, parent: 1, name: 'Effect: Employee Injuries' },
        { key: 11, parent: 1, name: 'Effect: Business Disruption' }
      ],
      'slip-1': [
        { key: 1, name: 'Slip Incident' },
        { key: 2, parent: 1, name: 'Cause: Wet Floor' },
        { key: 3, parent: 1, name: 'Effect: Minor Injury' }
      ],
      'slip-2': [
        { key: 1, name: 'Slip Incident' },
        { key: 2, parent: 1, name: 'Cause: Wet Floor' },
        { key: 3, parent: 1, name: 'Cause: Poor Lighting' },
        { key: 4, parent: 2, name: 'No Warning Signs' },
        { key: 5, parent: 3, name: 'Maintenance Issue' },
        { key: 6, parent: 1, name: 'Effect: Employee Injury' },
        { key: 7, parent: 1, name: 'Effect: Work Disruption' }
      ],
      'slip-3': [
        { key: 1, name: 'Slip Incident' },
        { key: 2, parent: 1, name: 'Cause: Wet Floor' },
        { key: 3, parent: 1, name: 'Cause: Poor Lighting' },
        { key: 4, parent: 1, name: 'Cause: Inadequate Footwear' },
        { key: 5, parent: 2, name: 'No Warning Signs' },
        { key: 6, parent: 2, name: 'Delayed Cleanup' },
        { key: 7, parent: 3, name: 'Burnt-out Bulbs' },
        { key: 8, parent: 4, name: 'Non-slip Soles Worn' },
        { key: 9, parent: 1, name: 'Effect: Employee Injury' },
        { key: 10, parent: 1, name: 'Effect: Lost Time Incident' },
        { key: 11, parent: 1, name: 'Effect: Compensation Claim' }
      ]
    };

    // Create a key to lookup mock data, or generate generic data
    const incidentType = incident.toLowerCase().includes('fire') ? 'fire' :
                        incident.toLowerCase().includes('slip') ? 'slip' :
                        'generic';
    
    const key = `${incidentType}-${level}`;
    
    let mockData = mockDataMap[key];
    
    // If no specific data found, generate generic data based on level
    if (!mockData) {
      mockData = this.generateGenericData(incident, level);
    }

    // Return the mock data wrapped in an Observable with a 1 second delay
    return of(mockData).pipe(delay(1000));
  }

  // Generate generic cause-effect data based on incident and level
  private generateGenericData(incident: string, level: number): TreeNodeData[] {
    const data: TreeNodeData[] = [
      { key: 1, name: incident }
    ];

    let nodeId = 2;
    
    const causes = ['Human Factor', 'Equipment Issue', 'Environmental Factor', 'Process Failure'];
    const effects = ['Injury', 'Property Damage', 'Work Disruption', 'Regulatory Issue'];
    
    // Always show 2 causes and 2 effects for level 1
    const numCauses = 2;
    const numEffects = 2;
    
    // Add primary causes and effects (this is level 1 content)
    for (let i = 0; i < numCauses; i++) {
      data.push({ key: nodeId, parent: 1, name: `Cause: ${causes[i]}` });
      
      // Only add sub-causes if level is 2 or higher
      if (level >= 2 && i < 2) {
        data.push({ key: nodeId + 100, parent: nodeId, name: `Sub-cause ${i + 1}.1` });
        
        // Only add deeper sub-causes if level is 3 or higher  
        if (level >= 3) {
          data.push({ key: nodeId + 200, parent: nodeId, name: `Sub-cause ${i + 1}.2` });
        }
      }
      nodeId++;
    }
    
    // Add primary effects
    for (let i = 0; i < numEffects; i++) {
      data.push({ key: nodeId, parent: 1, name: `Effect: ${effects[i]}` });
      
      // Only add secondary effects if level is 2 or higher
      if (level >= 2 && i < 2) {
        data.push({ key: nodeId + 300, parent: nodeId, name: `Secondary Effect ${i + 1}.1` });
        
        // Only add long-term effects if level is 3 or higher
        if (level >= 3) {
          data.push({ key: nodeId + 400, parent: nodeId, name: `Long-term Effect ${i + 1}.1` });
        }
      }
      nodeId++;
    }
    
    return data;
  }

  // Export the diagram as PDF by opening print dialog
  printDiagram() {
    if (!this.diagramInitialized) {
      alert('Please generate a diagram first');
      return;
    }

    // Generate SVG element from the diagram
    const svg = this.diagram.makeSvg({
      scale: 1,
      background: 'white',
    });

    if (!svg) {
      alert('Failed to generate diagram SVG.');
      return;
    }

    // Serialize SVG to a string and create a blob URL
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    // Open a new window and write the SVG image for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>HSE Incident Analysis - ${this.incident}</title>
            <style>
              body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
              .header { text-align: center; margin-bottom: 20px; }
              .incident-info { margin-bottom: 20px; }
              img { max-width: 100%; height: auto; }
              @media print {
                body { margin: 0; }
                .header, .incident-info { page-break-inside: avoid; }
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>HSE Incident Analysis Report</h1>
            </div>
            <div class="incident-info">
              <p><strong>Incident:</strong> ${this.incident}</p>
              <p><strong>Analysis Level:</strong> ${this.level}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <img src="${url}" alt="Cause-Effect Diagram" />
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait a bit for the image to load, then print
      setTimeout(() => {
        printWindow.print();
      }, 500);

      // Cleanup after printing
      printWindow.onafterprint = () => {
        URL.revokeObjectURL(url);
        printWindow.close();
      };
      
      // Fallback cleanup after 30 seconds
      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 30000);
    }
  }
}