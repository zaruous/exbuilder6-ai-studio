
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
    likes: 15,
    tags: ['dashboard', 'grid', 'analytics'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    comments: [],
    generationResult: {
        clxCode: `<html ...><!-- Grid Mock --></html>`,
        jsCode: `/* Grid Logic */`,
        javaFiles: [],
        logs: [],
        explanation: 'Dashboard grid example',
        previewMock: '<div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; color:white;"><div style="background:#333; height:100px;">Chart 1</div><div style="background:#333; height:100px;">Chart 2</div></div>'
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
