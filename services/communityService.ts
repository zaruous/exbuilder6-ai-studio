
import { SharedComponent, GenerationResult, Comment } from '../types';

// Mock Data
const MOCK_DB: SharedComponent[] = [
  {
    id: '1',
    title: 'Customer Registration Form',
    description: 'A standard registration form with validation for Email, Phone, and SSN. Includes server-side DTOs.',
    author: 'dev_master',
    likes: 24,
    tags: ['form', 'validation', 'customer'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(), // 2 days ago
    comments: [
      { id: 'c1', author: 'newbie_dev', content: 'Very clean layout, thanks!', rating: 5, createdAt: new Date().toISOString() },
      { id: 'c2', author: 'java_guru', content: 'Controller logic is solid.', rating: 4, createdAt: new Date().toISOString() }
    ],
    generationResult: {
      clxCode: `<html xmlns="http://www.w3.org/1999/xhtml" ...><!-- Mock CLX --></html>`,
      jsCode: `/* Controller */ function onSave() { alert('saved'); }`,
      javaFiles: [],
      logs: [],
      explanation: 'Pre-generated example.',
      previewMock: '<div style="padding:20px; border:1px solid #444; color:white;"><h3>Customer Reg</h3><input placeholder="Name"/><button>Save</button></div>'
    }
  },
  {
    id: '2',
    title: 'Sales Dashboard Grid',
    description: 'High performance grid layout for daily sales metrics. Includes pagination logic in the controller.',
    author: 'grid_wizard',
    likes: 150,
    tags: ['dashboard', 'grid', 'analytics'],
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days ago
    comments: [],
    generationResult: {
        clxCode: `<html ...><!-- Grid Mock --></html>`,
        jsCode: `/* Grid Logic */`,
        javaFiles: [],
        logs: [],
        explanation: 'Dashboard grid example',
        previewMock: '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; color:white;"><div style="background:#333; height:100px;">Chart 1</div><div style="background:#333; height:100px;">Chart 2</div></div>'
    }
  },
  {
    id: '3',
    title: 'Dark Mode Login',
    description: 'A sleek login screen with dark mode toggle and social login buttons.',
    author: 'ui_designer',
    likes: 85,
    tags: ['login', 'auth', 'darkmode'],
    createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago (Newest)
    comments: [],
    generationResult: {
        clxCode: `<html ...><!-- Login Mock --></html>`,
        jsCode: `/* Login Logic */`,
        javaFiles: [],
        logs: [],
        explanation: 'Login Template',
        previewMock: '<div style="padding:40px; background:#111; color:white; border-radius:8px; text-align:center;"><h2>Welcome Back</h2><input style="margin:5px; display:block; width:100%" placeholder="ID"/><input style="margin:5px; display:block; width:100%" type="password" placeholder="PW"/><button style="background:blue; width:100%; color:white;">Login</button></div>'
    }
  },
  {
    id: '4',
    title: 'Tree Navigation Menu',
    description: 'Recursive tree structure for file navigation or organization charts.',
    author: 'tree_lover',
    likes: 42,
    tags: ['tree', 'navigation', 'recursive'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(), // 5 days ago
    comments: [],
    generationResult: {
        clxCode: `<html ...><!-- Tree Mock --></html>`,
        jsCode: `/* Tree Logic */`,
        javaFiles: [],
        logs: [],
        explanation: 'Tree Structure',
        previewMock: '<div style="color:white; text-align:left;"><div>📁 Root</div><div style="padding-left:20px">📄 File 1</div><div style="padding-left:20px">📁 Folder A</div><div style="padding-left:40px">📄 File 2</div></div>'
    }
  }
];

export const getSharedComponents = async (): Promise<SharedComponent[]> => {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => resolve([...MOCK_DB]), 300);
  });
};

export const registerComponent = async (
  title: string, 
  description: string, 
  author: string, 
  result: GenerationResult
): Promise<SharedComponent> => {
  return new Promise((resolve) => {
    const newComp: SharedComponent = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      author: author || 'Anonymous',
      generationResult: result,
      comments: [],
      likes: 0,
      tags: ['generated'],
      createdAt: new Date().toISOString()
    };
    MOCK_DB.unshift(newComp); // Add to beginning
    setTimeout(() => resolve(newComp), 500);
  });
};

export const addComment = async (componentId: string, author: string, content: string, rating: number): Promise<Comment> => {
    return new Promise((resolve, reject) => {
        const comp = MOCK_DB.find(c => c.id === componentId);
        if(!comp) {
            reject("Component not found");
            return;
        }
        const newComment: Comment = {
            id: Math.random().toString(36).substr(2, 9),
            author: author || 'Anonymous',
            content,
            rating,
            createdAt: new Date().toISOString()
        };
        comp.comments.unshift(newComment);
        setTimeout(() => resolve(newComment), 300);
    });
}
