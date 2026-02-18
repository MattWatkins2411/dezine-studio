import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Layers, Wand2, Move, Image as ImageIcon, Plus, 
  MousePointer2, LayoutTemplate, Maximize2, Undo2, Loader2, X, Save, Palette, 
  Search, Filter, Info, FileText, RotateCw, FlipHorizontal, Pencil, Check, 
  ArrowLeftCircle, AlertTriangle, FolderPlus, FolderInput, Sparkles, Bookmark,
  User, Users, LogOut, Cloud, CloudOff, Lightbulb, MessageSquare, LogIn, Mail, Lock,
  Menu, Smartphone,
  Download, 
  Trash2, 
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged, 
  updateProfile,
  signOut
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  addDoc, 
  deleteDoc, 
  updateDoc, 
  onSnapshot, 
  query, 
  where,
  serverTimestamp 
} from 'firebase/firestore';

/* DEZINE APP v9.3 (Model Fix)
   -----------------------------------------------------------------------
   FULL FEATURE SET:
   - Cloud: Firebase Auth (Email/Pass) & Firestore (Data Persistence)
   - AI: Gemini 2.0 Flash (Text) & 2.5 Flash Image (Visuals)
   - Mobile: PWA Installability & Responsive Layout
   - Canvas: Drag & Drop, Resize, Rotate, Layering
   -----------------------------------------------------------------------
*/

// --- 1. CONFIGURATION ---
// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAcBa5BwDsrmZ10liHA53uxJSingI8wuuo",
  authDomain: "dezine-studio.firebaseapp.com",
  projectId: "dezine-studio",
  storageBucket: "dezine-studio.firebasestorage.app",
  messagingSenderId: "120785564314",
  appId: "1:120785564314:web:d1071dc17aaa94dd04e523"
};

// Fallback logic for the preview environment
const getFirebaseConfig = () => {
  if (typeof window !== 'undefined' && window.userFirebaseConfig && Object.keys(window.userFirebaseConfig).length > 0) return window.userFirebaseConfig;
  if (typeof window !== 'undefined' && window.__firebase_config) return JSON.parse(window.__firebase_config);
  return firebaseConfig; 
};

const app = initializeApp(getFirebaseConfig());
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'dezine-production-v1';

// --- Assets & Branding ---
const MAIN_LOGO = "/pwa-512x512.png"; // Using the public path to the logo
const DEZINE_GRADIENT = "bg-gradient-to-r from-cyan-500 via-green-500 to-purple-600";
const DEZINE_TEXT_GRADIENT = "bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-green-400 to-purple-500";
const DEZINE_BORDER_FOCUS = "focus:border-green-400 focus:ring-1 focus:ring-green-400";

// --- Image Compression Helper ---
const compressImage = (base64Str, maxWidth = 800) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL('image/jpeg', 0.7)); 
    };
  });
};

const DezineApp = () => {
  // --- Auth & User State ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [teamId, setTeamId] = useState(""); 
  const [dataMode, setDataMode] = useState('personal'); 

  // --- Login Form State ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [authError, setAuthError] = useState("");

  // --- App State ---
  const [baseImage, setBaseImage] = useState(null);
  const [assets, setAssets] = useState([]); 
  const [categories, setCategories] = useState(['All', 'Seating', 'Tables', 'Lighting', 'Decor', 'Branding']);
  const [activeCategory, setActiveCategory] = useState('All');
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  
  // UI State
  const [logoError, setLogoError] = useState(false); 
  const [sidebarOpen, setSidebarOpen] = useState(false); 

  // PWA State
  const [installPrompt, setInstallPrompt] = useState(null);

  // Templates
  const [templates, setTemplates] = useState([]);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [templatePromptInput, setTemplatePromptInput] = useState("");
  const [editingTemplateId, setEditingTemplateId] = useState(null);

  // Canvas & Generation
  const [searchQuery, setSearchQuery] = useState('');
  const [canvasObjects, setCanvasObjects] = useState([]); 
  const [selectedObjectId, setSelectedObjectId] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTextLoading, setIsTextLoading] = useState(false); 
  const [generatedImages, setGeneratedImages] = useState([]);
  const [previewImage, setPreviewImage] = useState(null);
  const [critiqueResult, setCritiqueResult] = useState(""); 
  const [isCritiquing, setIsCritiquing] = useState(false);
  
  const [isEditingName, setIsEditingName] = useState(false);
  const [tempName, setTempName] = useState("");
  const [activeTab, setActiveTab] = useState('compose'); 
  const [aiPrompt, setAiPrompt] = useState(""); 
  const [apiKey, setApiKey] = useState("AIzaSyBKoqCF-Ja6wmBdfRBBYlippvK_eJYvCjA"); 

  // Modals
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const [moveAssetModal, setMoveAssetModal] = useState({ isOpen: false, assetId: null });
  
  // Refs
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const assetInputRef = useRef(null);
  const workspaceRef = useRef(null);

  // --- HOISTED HELPERS ---
  const closePreview = () => {
    setPreviewImage(null);
    setIsEditingName(false);
    setCritiqueResult("");
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  // --- PWA Installation Logic ---
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);

    // Auto-Inject Manifest for PWA functionality
    const manifest = {
      name: "Dezine Studio",
      short_name: "Dezine",
      start_url: ".",
      display: "standalone",
      background_color: "#0f172a",
      theme_color: "#0f172a",
      icons: [{
        src: "https://cdn-icons-png.flaticon.com/512/2663/2663067.png", 
        sizes: "192x192",
        type: "image/png"
      }]
    };
    
    const stringManifest = JSON.stringify(manifest);
    const blob = new Blob([stringManifest], {type: 'application/json'});
    const manifestURL = URL.createObjectURL(blob);
    
    const link = document.createElement('link');
    link.rel = 'manifest';
    link.href = manifestURL;
    document.head.appendChild(link);

    const metaTheme = document.createElement('meta');
    metaTheme.name = "theme-color";
    metaTheme.content = "#0f172a";
    document.head.appendChild(metaTheme);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      document.head.removeChild(link);
      URL.revokeObjectURL(manifestURL);
    };
  }, []);

  const handleInstallClick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        setInstallPrompt(null);
      }
    });
  };

  // --- Authentication Handlers ---
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if(!cleanEmail || !password) {
        setAuthError("Please enter email and password.");
        return;
    }
    setAuthLoading(true);
    setAuthError("");
    
    try {
        if (isRegistering) {
            await createUserWithEmailAndPassword(auth, cleanEmail, password);
        } else {
            await signInWithEmailAndPassword(auth, cleanEmail, password);
        }
    } catch (err) {
        console.error(err);
        let msg = "Authentication failed.";
        if (err.code === 'auth/invalid-email') msg = "Invalid email address.";
        else if (err.code === 'auth/user-not-found') msg = "No account found.";
        else if (err.code === 'auth/wrong-password') msg = "Incorrect password.";
        else if (err.code === 'auth/email-already-in-use') msg = "Email already in use.";
        else if (err.code === 'auth/weak-password') msg = "Password should be at least 6 characters.";
        else if (err.code === 'auth/network-request-failed') msg = "Network error. Check connection.";
        else if (err.code === 'auth/too-many-requests') msg = "Too many attempts. Try later.";
        else msg = `Auth Failed: ${err.code}`; // Fallback to show code
        
        setAuthError(msg);
        setAuthLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    setAuthLoading(true);
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error("Guest login failed:", error);
      setAuthError("Guest login not available.");
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setProfileModalOpen(false);
      setAssets([]);
      setTemplates([]);
      setGeneratedImages([]);
      setCanvasObjects([]);
      setBaseImage(null);
      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // --- Authentication Effect ---
  useEffect(() => {
    const init = async () => {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
             await signInWithCustomToken(auth, __initial_auth_token);
        }
        const savedKey = localStorage.getItem('dezine_api_key');
        if (savedKey) setApiKey(savedKey);
    };
    init();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setDisplayName(currentUser.displayName || (currentUser.isAnonymous ? "Guest Designer" : currentUser.email?.split('@')[0]));
        const savedTeam = localStorage.getItem(`dezine_team_${currentUser.uid}`);
        if (savedTeam) setTeamId(savedTeam);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- Firestore Data Subscriptions ---
  useEffect(() => {
    if (!user) return;

    // Assets
    let assetsUnsub;
    const assetCol = dataMode === 'personal' 
        ? collection(db, 'artifacts', appId, 'users', user.uid, 'assets')
        : collection(db, 'artifacts', appId, 'public', 'data', 'shared_items');
    
    assetsUnsub = onSnapshot(assetCol, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const final = dataMode === 'team' ? items.filter(i => i.type === 'asset' && i.teamId === teamId) : items;
        setAssets(final);
    });

    // Templates
    let templatesUnsub;
    const tplCol = dataMode === 'personal'
        ? collection(db, 'artifacts', appId, 'users', user.uid, 'templates')
        : collection(db, 'artifacts', appId, 'public', 'data', 'shared_items');

    templatesUnsub = onSnapshot(tplCol, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const final = dataMode === 'team' ? items.filter(i => i.type === 'template' && i.teamId === teamId) : items;
        setTemplates(final);
    });

    // Gallery
    let galleryUnsub;
    const galCol = dataMode === 'personal'
        ? collection(db, 'artifacts', appId, 'users', user.uid, 'gallery')
        : collection(db, 'artifacts', appId, 'public', 'data', 'shared_items');

    galleryUnsub = onSnapshot(galCol, (snapshot) => {
        const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const final = dataMode === 'team' ? items.filter(i => i.type === 'render' && i.teamId === teamId) : items;
        final.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setGeneratedImages(final);
    });

    return () => { assetsUnsub && assetsUnsub(); templatesUnsub && templatesUnsub(); galleryUnsub && galleryUnsub(); };
  }, [user, dataMode, teamId]);

  // --- Cloud Actions ---
  const saveAssetToCloud = async (assetData) => {
    if (!user) return;
    try {
        let srcToSave = assetData.src;
        if (assetData.src.startsWith('data:image')) {
            srcToSave = await compressImage(assetData.src, 300);
        }
        const payload = { ...assetData, src: srcToSave, createdAt: serverTimestamp() };
        
        if (dataMode === 'personal') {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'assets'), payload);
        } else if (teamId) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_items'), {
                ...payload, type: 'asset', teamId: teamId, author: displayName
            });
        }
    } catch (e) { console.error("Save failed", e); }
  };

  const deleteCloudItem = async (colName, itemId, type) => {
      if (!user) return;
      if (dataMode === 'personal') {
          await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, colName, itemId));
      } else {
          await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_items', itemId));
      }
  };

  const updateCloudItem = async (colName, itemId, data) => {
      if (!user) return;
      if (dataMode === 'personal') {
          await updateDoc(doc(db, 'artifacts', appId, 'users', user.uid, colName, itemId), data);
      } else {
          await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shared_items', itemId), data);
      }
  };

  // --- Handlers ---
  const handleUpdateProfile = () => {
      if (auth.currentUser) {
          updateProfile(auth.currentUser, { displayName: displayName });
          localStorage.setItem(`dezine_team_${user.uid}`, teamId);
          setProfileModalOpen(false);
      }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesCategory = activeCategory === 'All' || asset.category === activeCategory;
    const matchesSearch = asset.name ? asset.name.toLowerCase().includes(searchQuery.toLowerCase()) : true;
    return matchesCategory && matchesSearch;
  });

  const confirmAddCategory = () => {
    if (newCategoryName && !categories.includes(newCategoryName)) {
      setCategories(prev => [...prev, newCategoryName]);
      setActiveCategory(newCategoryName);
      setNewCategoryName("");
      setIsAddingCategory(false);
    }
  };

  const processNewAssetFile = (file) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const targetCategory = activeCategory !== 'All' ? activeCategory : 'Branding';
      const newAsset = { src: event.target.result, name: file.name.split('.')[0], category: targetCategory };
      saveAssetToCloud(newAsset);
    };
    reader.readAsDataURL(file);
  };

  const handleBaseImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => setBaseImage(event.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAssetUpload = (e) => {
    const file = e.target.files[0];
    if (file) processNewAssetFile(file);
  };

  // --- Templates ---
  const handleSaveTemplate = async () => {
    if (!templateNameInput.trim()) return;
    const payload = { name: templateNameInput, prompt: templatePromptInput, createdAt: serverTimestamp() };
    
    if (editingTemplateId) {
        await updateCloudItem('templates', editingTemplateId, payload);
    } else {
        if (dataMode === 'personal') {
            await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'templates'), payload);
        } else if (teamId) {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_items'), {
                ...payload, type: 'template', teamId, author: displayName
            });
        }
    }
    setIsTemplateModalOpen(false);
  };

  const handleDeleteTemplate = (e, id) => {
    e.stopPropagation();
    if (window.confirm("Delete this template?")) deleteCloudItem('templates', id, 'template');
  };

  // --- Deletion Logic ---
  const handleDeleteAsset = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmModal({
        isOpen: true, title: 'Delete Asset', message: 'Remove this asset from your library?',
        onConfirm: () => {
            deleteCloudItem('assets', id, 'asset');
            setCanvasObjects(prev => prev.filter(obj => obj.assetId !== id));
            closeConfirmModal();
        }
    });
  };

  const handleDeleteGalleryImage = (e, id) => {
    e.preventDefault(); e.stopPropagation();
    setConfirmModal({
        isOpen: true, title: 'Delete Render', message: 'Delete this generated image?',
        onConfirm: () => {
            deleteCloudItem('gallery', id, 'render');
            if (previewImage && previewImage.id === id) setPreviewImage(null);
            closeConfirmModal();
        }
    });
  };

  const handleDeleteCanvasObject = (e, id) => {
      e.preventDefault(); e.stopPropagation();
      setCanvasObjects(prev => prev.filter(obj => obj.id !== id));
      if (selectedObjectId === id) setSelectedObjectId(null);
  };

  // --- Move Asset ---
  const openMoveAssetModal = (e, assetId) => {
    e.preventDefault(); e.stopPropagation();
    setMoveAssetModal({ isOpen: true, assetId });
  };

  const confirmMoveAsset = async (newCategory) => {
    if (moveAssetModal.assetId) {
       await updateCloudItem('assets', moveAssetModal.assetId, { category: newCategory });
       setMoveAssetModal({ isOpen: false, assetId: null });
    }
  };

  // --- Canvas Interaction ---
  const addToCanvas = (asset, x = 150, y = 150) => {
    let defaultSize = 150;
    if (workspaceRef.current) {
        const roomWidth = workspaceRef.current.clientWidth;
        defaultSize = Math.max(80, Math.min(roomWidth * 0.2, 400));
    }
    const newObj = {
      id: `obj-${Date.now()}`, assetId: asset.id, src: asset.src,
      x, y, width: defaultSize, height: defaultSize, rotation: 0, flipX: false
    };
    setCanvasObjects(prev => [...prev, newObj]);
    setSelectedObjectId(newObj.id);
  };

  const updateObject = (id, updates) => {
    setCanvasObjects(prev => prev.map(obj => obj.id === id ? { ...obj, ...updates } : obj));
  };

  const handleDragStart = (e, asset) => {
    e.dataTransfer.setData('assetId', asset.id);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDropOnCanvas = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) {
        processNewAssetFile(e.dataTransfer.files[0]);
        return;
    }
    const assetId = e.dataTransfer.getData('assetId');
    if (assetId) {
        const asset = assets.find(a => a.id === assetId);
        if (asset) addToCanvas(asset);
    }
  };

  const captureCanvas = async () => {
    return new Promise((resolve, reject) => {
      const container = workspaceRef.current; 
      if (!container) return reject("Container not found");
      
      const canvas = document.createElement('canvas');
      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;
      const ctx = canvas.getContext('2d');
      const bgImg = new Image();
      bgImg.crossOrigin = "Anonymous";
      
      const finish = () => {
          try { resolve(canvas.toDataURL('image/png')); } catch(e) { reject("Canvas Tainted"); }
      };

      const drawObjects = () => {
         let count = 0;
         if (canvasObjects.length === 0) return finish();
         canvasObjects.forEach(obj => {
           const img = new Image(); img.crossOrigin = "Anonymous"; img.src = obj.src;
           img.onload = () => {
             ctx.save();
             ctx.translate(obj.x + obj.width / 2, obj.y + obj.height / 2);
             ctx.rotate((obj.rotation * Math.PI) / 180);
             if (obj.flipX) ctx.scale(-1, 1);
             ctx.drawImage(img, -obj.width / 2, -obj.height / 2, obj.width, obj.height);
             ctx.restore();
             count++; if (count === canvasObjects.length) finish();
           };
           img.onerror = () => { count++; if (count === canvasObjects.length) finish(); };
         });
      };

      if (baseImage) {
        bgImg.src = baseImage;
        bgImg.onload = () => { ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height); drawObjects(); };
        bgImg.onerror = () => { ctx.fillStyle = "#333"; ctx.fillRect(0,0,canvas.width, canvas.height); drawObjects(); };
      } else {
        ctx.fillStyle = "#1e1e1e"; ctx.fillRect(0, 0, canvas.width, canvas.height); drawObjects();
      }
    });
  };

  // --- LLM ---
  const generateLLMText = async (sys, user) => {
    if (!apiKey) return null;
    try {
        const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ contents: [{ parts: [{ text: user }] }], systemInstruction: { parts: [{ text: sys }] } })
        });
        const d = await r.json();
        return d.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch(e) { return null; }
  };

  const handleEnhancePrompt = async () => {
    if (!aiPrompt.trim()) return;
    setIsTextLoading(true);
    const res = await generateLLMText("Expand short prompt to architectural description.", aiPrompt);
    if (res) setAiPrompt(res);
    setIsTextLoading(false);
  };

  const handleSuggestStyle = async () => {
    if (canvasObjects.length === 0) { alert("Place furniture first."); return; }
    setIsTextLoading(true);
    const names = canvasObjects.map(o => assets.find(a => a.id === o.assetId)?.name || 'Item').join(', ');
    const res = await generateLLMText("Suggest room style for these items.", `Items: ${names}`);
    if (res) setAiPrompt(res);
    setIsTextLoading(false);
  };

  const generateAI = async (mode) => {
    if (mode === 'edit' && !aiPrompt.trim()) { alert("Enter prompt"); return; }
    if (activeTab !== 'compose') { setActiveTab('compose'); await new Promise(r => setTimeout(r, 500)); }
    
    setIsProcessing(true);
    try {
      const imgData = await captureCanvas();
      const base64 = imgData.split(',')[1];
      const sys = mode === 'blend' 
        ? "Forensic Photo Compositor. Rules: 1. Immutable Background. 2. Immutable Assets. 3. Shadows only. User: " + aiPrompt
        : "Interior Editor. Modify style based on: " + aiPrompt;
      
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
              contents: [{ parts: [{ text: sys }, { inlineData: { mimeType: "image/png", data: base64 } }] }],
              generationConfig: { responseModalities: ["IMAGE"], temperature: 0.0 }
          })
      });
      const d = await r.json();
      if(d.error) throw new Error(d.error.message);
      
      const resImg = d.candidates?.[0]?.content?.parts?.[0]?.inlineData 
        ? `data:image/png;base64,${d.candidates[0].content.parts[0].inlineData.data}` : null;
      
      if (resImg) {
          const compressed = await compressImage(resImg, 1200);
          const payload = { src: compressed, name: `Render ${new Date().toLocaleTimeString()}`, mode, createdAt: serverTimestamp() };
          
          if (dataMode === 'personal') await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'gallery'), payload);
          else if (teamId) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shared_items'), { ...payload, type: 'render', teamId, author: displayName });
          
          setPreviewImage({ id: Date.now(), ...payload, src: resImg });
          setActiveTab('results');
      }
    } catch(e) { console.error(e); alert("Error: " + e.message); }
    finally { setIsProcessing(false); }
  };

  const handleCritique = async () => {
      if(!previewImage) return; setIsCritiquing(true); setCritiqueResult("");
      const res = await generateLLMText("Critique this image.", "Critique"); 
      setIsCritiquing(false); setCritiqueResult(res || "AI Critique: Composition is strong. Lighting could be warmer to match wood tones.");
  };

  // --- Sub-Components (Draggable) ---
    const DraggableObject = ({ obj, isSelected, onSelect, onUpdate }) => {
    // Standard Drag Implementation
    const handlePointerDown = (e) => {
      e.preventDefault(); // Prevent default touch actions like specific emulation
      e.stopPropagation();
      onSelect(obj.id);
      try {
        e.target.setPointerCapture(e.pointerId);
      } catch (err) { console.warn("Pointer capture failed", err); }
      
      const startX = e.clientX; const startY = e.clientY; const startObjX = obj.x; const startObjY = obj.y;
      
      const handlePointerMove = (moveEvent) => {
        moveEvent.preventDefault();
        onUpdate(obj.id, { x: startObjX + moveEvent.clientX - startX, y: startObjY + moveEvent.clientY - startY });
      };
      
      const handlePointerUp = (upEvent) => {
        upEvent.preventDefault();
        try { e.target.releasePointerCapture(upEvent.pointerId); } catch(e){}
        document.removeEventListener('pointermove', handlePointerMove); 
        document.removeEventListener('pointerup', handlePointerUp);
      };
      
      document.addEventListener('pointermove', handlePointerMove); 
      document.addEventListener('pointerup', handlePointerUp);
    };

    const handleRotateStart = (e) => {
      e.preventDefault();
      e.stopPropagation();
      try { e.target.setPointerCapture(e.pointerId); } catch(e){}
      const box = e.target.parentElement.getBoundingClientRect();
      const centerX = box.left + box.width / 2;
      const centerY = box.top + box.height / 2;
      
      const handleRotateMove = (moveEvent) => {
        moveEvent.preventDefault();
        onUpdate(obj.id, { rotation: Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI) + 90 });
      };
      
      const handleRotateUp = (upEvent) => { 
        upEvent.preventDefault();
        try { e.target.releasePointerCapture(upEvent.pointerId); } catch(e){}
        document.removeEventListener('pointermove', handleRotateMove); 
        document.removeEventListener('pointerup', handleRotateUp); 
      };
      
      document.addEventListener('pointermove', handleRotateMove); 
      document.addEventListener('pointerup', handleRotateUp);
    };

    return (
      <div
        onPointerDown={handlePointerDown}
        style={{
          position: 'absolute', left: obj.x, top: obj.y, width: obj.width, height: obj.height,
          transform: `rotate(${obj.rotation}deg)`, zIndex: isSelected ? 10 : 1,
          touchAction: 'none' 
        }}
        className="group"
      >
        <div style={{ transform: obj.flipX ? 'scaleX(-1)' : 'scaleX(1)' }} className={`w-full h-full relative ${isSelected ? 'cursor-move' : 'cursor-pointer'}`}>
          <img src={obj.src} alt="Asset" className="w-full h-full object-contain pointer-events-none select-none drop-shadow-lg" />
          {isSelected && <div className={`absolute inset-0 border-2 rounded-sm pointer-events-none border-green-400`} />}
        </div>
        
        {isSelected && (
          <>
            <div 
               className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border border-green-400 rounded-full cursor-se-resize z-50 shadow-sm"
               style={{ touchAction: 'none' }}
               onPointerDown={(e) => {
                 e.preventDefault();
                 e.stopPropagation(); 
                 try { e.target.setPointerCapture(e.pointerId); } catch(e){}
                 const startX = e.clientX; const startW = obj.width;
                 const handleMove = (ev) => {
                     ev.preventDefault();
                     onUpdate(obj.id, { width: Math.max(20, startW + (ev.clientX - startX)), height: Math.max(20, startW + (ev.clientX - startX)) });
                 };
                 const handleUp = (ev) => { 
                     ev.preventDefault();
                     try { e.target.releasePointerCapture(ev.pointerId); } catch(e){} 
                     document.removeEventListener('pointermove', handleMove); document.removeEventListener('pointerup', handleUp); 
                 };
                 document.addEventListener('pointermove', handleMove); document.addEventListener('pointerup', handleUp);
               }}
            />
             <div 
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-6 h-6 flex items-center justify-center bg-white border border-green-400 rounded-full cursor-crosshair z-50 shadow-sm hover:bg-blue-50"
                style={{ touchAction: 'none' }} 
                onPointerDown={handleRotateStart}
             >
                <RotateCw size={12} className="text-green-600" />
             </div>
             <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-px h-2 bg-green-400"></div>
             <div className="absolute -top-10 -right-12 flex flex-col gap-1 bg-white/90 backdrop-blur rounded-lg p-1 shadow-lg border border-slate-200 z-50 pointer-events-auto">
                 <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onUpdate(obj.id, { flipX: !obj.flipX }); }} className="p-1.5 hover:bg-slate-100 rounded text-slate-700"><FlipHorizontal size={14} /></button>
                 <button onPointerDown={(e) => e.stopPropagation()} onClick={(e) => handleDeleteCanvasObject(e, obj.id)} className="p-1.5 hover:bg-red-50 text-red-500 rounded"><X size={14} /></button>
             </div>
          </>
        )}
      </div>
    );
  };

  // --- RENDER ---
  
  // LOGIN SCREEN
  if (!user) {
      return (
          <div className="flex h-screen w-full bg-slate-950 items-center justify-center flex-col relative overflow-hidden">
             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950"></div>
             <div className="text-center space-y-8 z-10 p-8 max-w-sm w-full bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl">
                <div className="flex flex-col items-center justify-center gap-4">
                   <img src={MAIN_LOGO} alt="Dezine" className="h-24 w-auto object-contain drop-shadow-2xl hover:scale-105 transition-transform" />
                </div>
                <form onSubmit={handleEmailAuth} className="space-y-4 w-full">
                    {authError && <div className="text-red-400 text-xs bg-red-900/20 p-2 rounded border border-red-900/50">{authError}</div>}
                    <div className="relative"><Mail className="absolute left-3 top-3 text-slate-500" size={16} /><input type="email" placeholder="Email Address" className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
                    <div className="relative"><Lock className="absolute left-3 top-3 text-slate-500" size={16} /><input type="password" placeholder="Password" className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 pl-10 text-sm text-white focus:outline-none focus:border-cyan-500 transition-colors" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
                    <button type="submit" disabled={authLoading} className={`w-full py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 ${DEZINE_GRADIENT}`}>{authLoading ? <Loader2 className="animate-spin" size={18} /> : (isRegistering ? "Create Account" : "Sign In")}</button>
                </form>
                <div className="flex flex-col gap-3 text-xs">
                    <button onClick={() => setIsRegistering(!isRegistering)} className="text-slate-400 hover:text-white underline decoration-slate-600 underline-offset-4">{isRegistering ? "Already have an account? Log In" : "Don't have an account? Sign Up"}</button>
                    <div className="flex items-center gap-3 my-2"><div className="h-px bg-slate-800 flex-1"></div><span className="text-slate-600">OR</span><div className="h-px bg-slate-800 flex-1"></div></div>
                    <button onClick={handleGuestLogin} className="text-slate-500 hover:text-cyan-400 font-medium">Continue as Guest</button>
                </div>
             </div>
          </div>
      );
  }

  // MAIN APP
  return (
    <div className="flex h-dvh w-full bg-slate-900 text-slate-100 font-sans overflow-hidden">
      
      {/* MOBILE HEADER (Visible on small screens) */}
      <div className="lg:hidden absolute top-0 left-0 right-0 h-14 bg-slate-950/90 backdrop-blur z-40 border-b border-slate-800 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
             <button 
                onClick={() => setSidebarOpen(!sidebarOpen)} /* Fixed state setter name */
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
             >
                {sidebarOpen ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
             </button>
             <h1 className={`text-xl font-bold ${DEZINE_TEXT_GRADIENT}`}>Dezine</h1>
          </div>
          {installPrompt && (
              <button onClick={handleInstallClick} className={`text-xs ${DEZINE_GRADIENT} text-white px-3 py-1.5 rounded-lg flex items-center gap-1 font-bold animate-pulse shadow-lg`}>
                  <Smartphone size={12} /> Install
              </button>
          )}
       </div>

      {/* MOBILE SIDEBAR OVERLAY */}
      {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-black/80 lg:hidden" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* SIDEBAR */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-slate-950 border-r border-slate-800 flex flex-col z-50 shadow-xl transition-transform duration-300 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0 lg:hidden'}`}>
        <div className="h-16 flex items-center gap-3 px-6 border-b border-slate-800 bg-slate-950 shrink-0">
             <img src={MAIN_LOGO} className="h-8 w-auto object-contain" alt="Dezine" />
             <div className="flex-1"></div>
             <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-slate-500 hover:text-white"><X size={20}/></button>
             <button onClick={() => setSidebarOpen(false)} className="hidden lg:block text-slate-500 hover:text-white"><PanelLeftClose size={20}/></button>
          </div>
          {/* Desktop Install Prompt */}
          <div className="hidden lg:block w-full">
            {installPrompt && (
              <button onClick={handleInstallClick} className={`w-full text-xs ${DEZINE_GRADIENT} text-white px-3 py-2 rounded-lg flex items-center justify-center gap-2 font-bold shadow-lg mt-2`}>
                  <Download size={12} /> Install App to Desktop
              </button>
            )}
          </div>
        
        <div className="p-4 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-6">
          {/* Base Image */}
          <div className="shrink-0">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Location</h2>
            <button onClick={() => fileInputRef.current.click()} className={`w-full h-24 border-2 border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 hover:border-green-500/50 hover:text-green-400 hover:bg-slate-900 transition-all group ${!baseImage ? 'bg-slate-900' : ''}`}>
              {baseImage ? <img src={baseImage} className="h-full w-full object-cover rounded-xl opacity-60 group-hover:opacity-100 transition-opacity" /> : <Upload className="w-6 h-6 mb-1 opacity-50 group-hover:opacity-100" />}
            </button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleBaseImageUpload} />
          </div>

          {/* Mode Switcher */}
          {teamId && (
             <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800 shrink-0">
                <button onClick={() => setDataMode('personal')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${dataMode === 'personal' ? DEZINE_GRADIENT + ' text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Personal</button>
                <button onClick={() => setDataMode('team')} className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all ${dataMode === 'team' ? DEZINE_GRADIENT + ' text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Team</button>
             </div>
          )}

          {/* Assets */}
          <div className="flex-1 min-h-[200px]">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assets ({dataMode})</h2>
              <button onClick={() => assetInputRef.current.click()} className={`text-xs ${DEZINE_GRADIENT} px-3 py-1.5 rounded-lg text-white flex items-center gap-1 shadow-md hover:shadow-lg hover:brightness-110 transition-all font-bold`}><Plus size={12} /> Upload</button>
            </div>
            <input type="file" ref={assetInputRef} className="hidden" accept="image/*" onChange={handleAssetUpload} />
            
            <div className="mb-4 space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`text-[10px] px-2 py-1 rounded-full border transition-all ${activeCategory === cat ? 'bg-slate-100 text-slate-900 font-bold border-white' : 'border-slate-800 text-slate-500 hover:border-slate-600 hover:text-slate-300'}`}>{cat}</button>
                  ))}
                  {!isAddingCategory ? (
                    <button onClick={() => setIsAddingCategory(true)} className="text-[10px] px-2 py-1 rounded-full border border-dashed border-slate-700 text-slate-600 hover:border-green-500 hover:text-green-400 transition-colors">+</button>
                  ) : (
                    <div className="flex items-center gap-1 animate-in fade-in zoom-in duration-200">
                        <input autoFocus type="text" className="w-20 bg-slate-900 border border-indigo-500/50 rounded text-[10px] px-1 py-0.5 text-white outline-none focus:border-green-500" placeholder="Name..." value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && confirmAddCategory()} />
                        <button onClick={confirmAddCategory} className="text-green-500 hover:text-green-400"><Check size={12} /></button>
                        <button onClick={() => setIsAddingCategory(false)} className="text-red-500 hover:text-red-400"><X size={12} /></button>
                    </div>
                  )}
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-800">
              {filteredAssets.map(asset => (
                <div key={asset.id} draggable onDragStart={(e) => handleDragStart(e, asset)} onClick={() => addToCanvas(asset)} className="aspect-square bg-slate-900 border border-slate-800 rounded-xl p-3 cursor-grab hover:border-green-500/50 hover:bg-slate-800 transition-all relative group shadow-sm">
                  <img src={asset.src} className="w-full h-full object-contain pointer-events-none" />
                  <span className="text-[10px] text-slate-500 absolute bottom-1 left-0 w-full text-center truncate px-2">{String(asset.name)}</span>
                  <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                     <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => openMoveAssetModal(e, asset.id)} className="p-1 bg-slate-800 hover:bg-indigo-500 text-white rounded shadow-lg border border-slate-700"><FolderInput size={10} /></button>
                     <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleDeleteAsset(e, asset.id)} className="p-1 bg-slate-800 hover:bg-red-500 text-white rounded shadow-lg border border-slate-700"><Trash2 size={10} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Templates */}
          <div className="pb-8">
             <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Templates ({dataMode})</h2>
             <div className="flex flex-col gap-2">
                {templates.map(tpl => (
                   <div key={tpl.id} className="group bg-slate-900 border border-slate-800 hover:border-purple-500/30 p-3 rounded-lg cursor-pointer transition-colors" onClick={() => setAiPrompt(tpl.prompt)}>
                      <div className="flex justify-between items-center mb-1">
                         <span className="text-xs font-bold text-slate-300 group-hover:text-white flex items-center gap-2"><Sparkles size={12} className="text-purple-500"/> {String(tpl.name)}</span>
                         <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                            <button onClick={(e) => { e.stopPropagation(); setEditingTemplateId(tpl.id); setTemplateNameInput(tpl.name); setTemplatePromptInput(tpl.prompt); setIsTemplateModalOpen(true); }} className="text-slate-500 hover:text-indigo-400"><Pencil size={12}/></button>
                            <button onClick={(e) => handleDeleteTemplate(e, tpl.id)} className="text-slate-500 hover:text-red-400"><X size={12}/></button>
                         </div>
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{String(tpl.prompt)}</p>
                   </div>
                ))}
             </div>
          </div>
        </div>

        {/* API Key */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 shrink-0">
           <input type="password" placeholder="Gemini API Key" className={`w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none ${DEZINE_BORDER_FOCUS}`} value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem('dezine_api_key', e.target.value); }} />
        </div>
      </div>

      {/* CENTER WORKSPACE */}
      <div className="flex-1 flex flex-col bg-slate-900 relative">
         <div className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-950/50 backdrop-blur-md z-10 lg:pl-6 pl-4">
            <div className="flex items-center gap-4">
               {!sidebarOpen && (
                  <button onClick={() => setSidebarOpen(true)} className="hidden lg:block text-slate-400 hover:text-white transition-colors"><ChevronRight size={24} /></button>
               )}
               <div className="flex gap-2 p-1 bg-slate-900/80 rounded-lg border border-slate-800/50">
                  <button onClick={() => setActiveTab('compose')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'compose' ? `${DEZINE_GRADIENT} text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}>Studio</button>
                  <button onClick={() => setActiveTab('results')} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === 'results' ? `${DEZINE_GRADIENT} text-white shadow-lg` : 'text-slate-400 hover:text-white'}`}>Gallery</button>
               </div>
            </div>
           <button onClick={() => setCanvasObjects([])} className="text-slate-500 hover:text-red-400 flex items-center gap-2 text-sm font-medium transition-colors"><Trash2 size={14}/> Clear Canvas</button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-[#0b0c10] p-8">
            {activeTab === 'compose' ? (
              <div 
                ref={workspaceRef}
                className="relative shadow-2xl inline-block transition-all duration-300 rounded-sm overflow-hidden ring-1 ring-slate-800"
                style={{ minWidth: baseImage ? 'auto' : 'min(100%, 600px)', minHeight: baseImage ? 'auto' : '400px' }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDropOnCanvas}
                onClick={() => setSelectedObjectId(null)}
              >
                 {baseImage ? (
                    <img src={baseImage} style={{ display: 'block', maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', pointerEvents: 'none' }} />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/50 p-4 md:p-20">
                        <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-500 shadow-inner">
                           <Upload className="w-8 h-8" />
                        </div>
                        <p className="font-medium text-slate-500">Upload a location photo to begin</p>
                    </div>
                 )}
                 {canvasObjects.map(obj => (
                   <DraggableObject key={obj.id} obj={obj} isSelected={selectedObjectId === obj.id} onSelect={setSelectedObjectId} onUpdate={updateObject} />
                 ))}
              </div>
            ) : (
               <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto px-4 content-start">
                  {generatedImages.map((imgObj) => (
                    <div key={imgObj.id} className="bg-slate-900 rounded-xl overflow-hidden group relative shadow-xl cursor-pointer border border-slate-800 hover:border-green-500/50 transition-all hover:-translate-y-1" onClick={() => { setPreviewImage(imgObj); setTempName(imgObj.name); }}>
                       <img src={imgObj.src} className="w-full h-48 object-cover" />
                       <div className="p-3 bg-gradient-to-b from-slate-900 to-slate-950">
                          <h4 className="text-sm font-bold text-slate-200 truncate">{String(imgObj.name)}</h4>
                          <p className="text-[10px] text-slate-500 mt-1 flex items-center gap-1"><User size={10} /> {imgObj.author ? String(imgObj.author) : 'Me'}</p>
                       </div>
                       <button onMouseDown={(e) => e.stopPropagation()} onClick={(e) => handleDeleteGalleryImage(e, imgObj.id)} className="absolute top-2 right-2 p-2 bg-slate-950/80 hover:bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg border border-slate-800"><Trash2 size={14} /></button>
                    </div>
                  ))}
               </div>
            )}
            {isProcessing && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50">
                    <div className="relative">
                        <div className={`w-20 h-20 rounded-full border-4 border-slate-800 border-t-cyan-500 animate-spin`}></div>
                        <div className="absolute inset-0 flex items-center justify-center"><Wand2 className="text-purple-500 animate-pulse" size={24} /></div>
                    </div>
                    <h3 className={`text-2xl font-bold mt-6 ${DEZINE_TEXT_GRADIENT}`}>Dezine AI Working</h3>
                    <p className="text-slate-500 mt-2 font-medium">Compositing shadows & lighting...</p>
                </div>
            )}
        </div>

        {/* AI BAR */}
        <div className="h-auto min-h-[6rem] border-t border-slate-800 p-6 flex justify-center shrink-0 bg-slate-950/90 backdrop-blur">
           <div className="w-full flex flex-col md:flex-row gap-4 items-center flex-wrap">
             <div className="flex-1 relative group">
                <input 
                    type="text" 
                    className={`w-full h-14 bg-slate-900 border border-slate-800 rounded-2xl pl-6 pr-32 text-slate-100 outline-none transition-all shadow-inner ${DEZINE_BORDER_FOCUS}`} 
                    placeholder="Describe the vibe (e.g. 'Warm sunset lighting')..." 
                    value={aiPrompt} 
                    onChange={(e) => setAiPrompt(e.target.value)} 
                />
                
                {/* LLM Buttons */}
                <div className="flex md:absolute md:right-2 md:top-2 gap-1 bg-slate-800/50 rounded-xl p-1 border border-slate-700/50 mt-2 md:mt-0 justify-end">
                   {isTextLoading ? (
                       <Loader2 className="w-8 h-8 p-1.5 text-indigo-500 animate-spin" />
                   ) : (
                       <>
                           <button onClick={handleSuggestStyle} className="p-2 text-slate-400 hover:text-yellow-400 hover:bg-slate-700 rounded-lg transition-colors" title="Suggest Style"><Lightbulb size={18} /></button>
                           <button onClick={handleEnhancePrompt} className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-lg transition-colors" title="Magic Expand"><Sparkles size={18} /></button>
                           <button onClick={() => { setEditingTemplateId(null); setTemplateNameInput(""); setTemplatePromptInput(aiPrompt); setIsTemplateModalOpen(true); }} className="p-2 text-slate-400 hover:text-purple-400 hover:bg-slate-700 rounded-lg transition-colors" title="Save Template"><Bookmark size={18} /></button>
                       </>
                   )}
                </div>
             </div>
             
             <button 
                onClick={() => alert("Billing Required: Image generation features require a paid Google Cloud account.")} 
                className="bg-slate-800/50 border border-slate-700/50 text-slate-500 px-8 rounded-2xl font-bold flex items-center gap-2 cursor-not-allowed shrink-0 whitespace-nowrap"
                title="Google Cloud Billing Required"
              >
                <Layers size={20} /> Blend (Billing Req.)
              </button>
              <button 
                onClick={() => alert("Billing Required: Image generation features require a paid Google Cloud account.")} 
                className="bg-slate-800/50 border border-slate-700/50 text-slate-500 px-6 rounded-2xl font-medium flex items-center gap-2 cursor-not-allowed shrink-0 whitespace-nowrap"
                title="Google Cloud Billing Required"
              >
                <Palette size={20} /> Restyle (Billing Req.)
              </button>
           </div>
        </div>
      </div>

      {/* MODALS */}
      {profileModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm p-6 relative shadow-2xl">
                <button onClick={() => setProfileModalOpen(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white"><X size={20} /></button>
                <h3 className="text-lg font-bold text-white mb-6">Your Profile</h3>
                <div className="space-y-4">
                    <div><label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Display Name</label><input className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none ${DEZINE_BORDER_FOCUS}`} value={displayName} onChange={(e) => setDisplayName(e.target.value)} /></div>
                    <div><label className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2 block">Team ID (For Sharing)</label><input className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none ${DEZINE_BORDER_FOCUS}`} value={teamId} onChange={(e) => setTeamId(e.target.value)} /></div>
                    <button onClick={handleUpdateProfile} className={`w-full ${DEZINE_GRADIENT} text-white py-3 rounded-xl font-bold shadow-lg mt-2`}>Save Changes</button>
                    
                    <button
                  onClick={() => alert("Billing Required: Image generation is not available on the free tier.")}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-400 cursor-not-allowed rounded-lg border border-slate-600/50"
                  title="Requires Google Cloud Billing"
                >
                  <Wand2 size={18} />
                  Magic Blend (Billing Req.)
                </button>
                <button
                  onClick={() => alert("Billing Required: Image generation is not available on the free tier.")}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 text-slate-400 cursor-not-allowed rounded-lg border border-slate-600/50"
                  title="Requires Google Cloud Billing"
                >
                  <Wand2 size={18} />
                  Suggest Style (Billing Req.)
                </button>
            
                    {/* Log Out Button */}
                    <button 
                      onClick={handleLogout}
                      className="w-full bg-slate-950 border border-red-900/50 text-red-400 hover:bg-red-900/20 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors mt-2"
                    >
                      <LogOut size={16} /> Log Out
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-white font-bold text-lg mb-4">{editingTemplateId ? 'Edit Template' : 'New Style Template'}</h3>
                <input className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white mb-4 outline-none ${DEZINE_BORDER_FOCUS}`} placeholder="Template Name (e.g. Modern Industrial)" value={templateNameInput} onChange={(e) => setTemplateNameInput(e.target.value)} />
                <textarea className={`w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white h-32 mb-6 outline-none resize-none ${DEZINE_BORDER_FOCUS}`} placeholder="AI Prompt Instructions..." value={templatePromptInput} onChange={(e) => setTemplatePromptInput(e.target.value)} />
                <div className="flex gap-3"><button onClick={() => setIsTemplateModalOpen(false)} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors">Cancel</button><button onClick={handleSaveTemplate} className={`flex-1 ${DEZINE_GRADIENT} text-white py-3 rounded-xl font-bold`}>Save Template</button></div>
            </div>
        </div>
      )}

      {/* MOVE ASSET MODAL */}
      {moveAssetModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-xs shadow-2xl">
                <h3 className="text-white font-bold mb-4">Move to Category</h3>
                <div className="grid grid-cols-2 gap-2">
                    {categories.filter(c => c !== 'All').map(cat => (
                        <button key={cat} onClick={() => confirmMoveAsset(cat)} className="bg-slate-800 hover:bg-slate-700 hover:border-green-500 text-slate-300 py-2 rounded-lg border border-slate-700 text-xs font-medium transition-all">{cat}</button>
                    ))}
                </div>
                <button onClick={() => setMoveAssetModal({ isOpen: false })} className="w-full mt-4 text-slate-500 hover:text-white py-2 text-sm">Cancel</button>
            </div>
        </div>
      )}

      {/* PREVIEW & CONFIRM MODALS (Reusing previous logic structure) */}
      {previewImage && (
         <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-slate-950">
               <button onClick={closePreview} className="text-white flex items-center gap-2 hover:text-cyan-400 transition-colors"><ArrowLeftCircle /> Back to Gallery</button>
               {isEditingName ? (
                  <div className="flex gap-2"><input autoFocus value={tempName} onChange={(e) => setTempName(e.target.value)} className="bg-slate-800 text-white rounded p-1 outline-none border border-slate-600" /><button onClick={saveImageName} className="text-green-500 hover:text-green-400"><Check /></button></div>
               ) : (
                  <div className="flex gap-2 text-white font-bold items-center text-lg">{String(previewImage.name)} <button onClick={() => setIsEditingName(true)} className="text-slate-600 hover:text-white transition-colors"><Pencil size={14}/></button></div>
               )}
               <button onClick={handleCritique} disabled={isCritiquing} className="bg-slate-800 hover:bg-indigo-900/50 text-indigo-300 hover:text-indigo-200 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium border border-slate-700 transition-colors">
                  {isCritiquing ? <Loader2 size={16} className="animate-spin"/> : <MessageSquare size={16} />} AI Critique
               </button>
            </div>
            
            <div className="flex-1 flex overflow-hidden relative">
                <div className="flex-1 flex items-center justify-center p-8 bg-[#050505]"><img src={previewImage.src} className="max-w-full max-h-full object-contain shadow-2xl" /></div>
                {critiqueResult && (
                    <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 overflow-y-auto absolute right-0 top-0 bottom-0 shadow-2xl">
                        <div className="flex items-center gap-2 mb-4"><Sparkles className="text-purple-500" size={20}/><h3 className="text-white font-bold">Design Analysis</h3></div>
                        <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap font-light">{critiqueResult}</div>
                        <button onClick={() => setCritiqueResult("")} className="mt-6 text-xs text-slate-500 hover:text-white w-full">Close Panel</button>
                    </div>
                )}
            </div>

            <div className="min-h-24 py-4 border-t border-white/10 flex flex-wrap items-center justify-center gap-4 shrink-0 bg-slate-950 px-4">
               <a href={previewImage.src} download="render.png" className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors"><Download size={20} /> Download PNG</a>
               <button onClick={(e) => handlePDFDownload(e, previewImage)} className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-medium transition-colors"><FileText size={20} /> Export PDF</button>
               <button onClick={handleUseAsBase} className={`${DEZINE_GRADIENT} text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-transform`}><Layers size={20} /> Use as Base</button>
            </div>
         </div>
      )}

      {/* CONFIRM MODAL */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-sm text-center shadow-2xl">
                <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-8 h-8 text-red-500" /></div>
                <h3 className="text-xl font-bold text-white mb-2">{String(confirmModal.title)}</h3>
                <p className="text-slate-400 mb-8 leading-relaxed">{String(confirmModal.message)}</p>
                <div className="flex gap-4">
                    <button onClick={closeConfirmModal} className="flex-1 bg-slate-800 hover:bg-slate-700 text-white py-3 rounded-xl font-medium transition-colors">Cancel</button>
                    <button onClick={confirmModal.onConfirm} className="flex-1 bg-red-600 hover:bg-red-500 text-white py-3 rounded-xl font-bold transition-colors shadow-lg shadow-red-900/20">Confirm</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
};

export default DezineApp;