import { useEffect, useState } from "react";
import { UploadCloud, Link as LinkIcon, FileText, Loader2, CheckCircle2, Target } from "lucide-react";
import { auth } from "../firebase/config";
import { apiUrl } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { PageTransition } from "../components/PageTransition";
import { motion } from "framer-motion";

const containerVariants = {
    visible: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const itemVariants: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0,
        transition: {
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1]
        }
    }
};

type TopicOutlineItem = {
    id: string;
    name: string;
    subtopics: string[];
    summary?: string;
    recommended_questions: number;
};

type UploadedDocument = {
    doc_id: string;
    title: string;
    topic_outline: TopicOutlineItem[];
};

export function UploadPage() {
    const [activeTab, setActiveTab] = useState<"pdf" | "url">("pdf");
    const [file, setFile] = useState<File | null>(null);
    const [url, setUrl] = useState("");
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState("Medium");
    const [questionTypes, setQuestionTypes] = useState<string[]>(["mcq", "short"]);
    const [loadingAction, setLoadingAction] = useState<"analyze" | "test" | "mindmap" | null>(null);
    const [uploadedDoc, setUploadedDoc] = useState<UploadedDocument | null>(null);
    const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
    const navigate = useNavigate();

    useEffect(() => {
        setUploadedDoc(null);
        setSelectedTopics([]);
    }, [activeTab, file, url]);

    const handleTypeChange = (type: string) => {
        setQuestionTypes(prev =>
            prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
        );
    };

    const toggleTopic = (topicId: string) => {
        setSelectedTopics(prev =>
            prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
        );
    };

    const uploadSource = async () => {
        if (!auth.currentUser) {
            alert("Please log in first");
            return null;
        }

        if (activeTab === "pdf" && !file) {
            alert("Select a PDF");
            return null;
        }

        if (activeTab === "url" && !url) {
            alert("Enter a URL");
            return null;
        }

        const formData = new FormData();
        formData.append("user_id", auth.currentUser.uid);

        let endpoint = apiUrl("/upload/");
        if (activeTab === "pdf" && file) {
            formData.append("file", file);
            endpoint += "pdf";
        } else {
            formData.append("url", url);
            endpoint += "url";
        }

        const res = await fetch(endpoint, {
            method: "POST",
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Upload failed");
        }

        const data = await res.json();
        const analyzedDoc = {
            doc_id: data.doc_id,
            title: data.title || file?.name || url,
            topic_outline: data.topic_outline || [],
        };

        setUploadedDoc(analyzedDoc);
        setSelectedTopics((data.topic_outline || []).map((topic: TopicOutlineItem) => topic.id));
        return analyzedDoc;
    };

    const handleAnalyzeTopics = async () => {
        setLoadingAction("analyze");
        try {
            await uploadSource();
        } catch (err) {
            console.error(err);
            alert("Upload or topic analysis failed. Make sure backend is running.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleGenerateTest = async () => {
        if (!auth.currentUser) return alert("Please log in first");
        if (questionTypes.length === 0) return alert("Select at least one question type");

        setLoadingAction("test");
        try {
            const docData = uploadedDoc || await uploadSource();
            if (!docData) return;

            if ((docData.topic_outline || []).length > 0 && selectedTopics.length === 0) {
                alert("Select at least one topic to generate a test.");
                return;
            }

            const testRes = await fetch(apiUrl("/tests/generate"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: auth.currentUser.uid,
                    doc_id: docData.doc_id,
                    topics: selectedTopics,
                    num_questions: numQuestions,
                    difficulty: difficulty,
                    question_types: questionTypes
                })
            });

            if (!testRes.ok) {
                const errorData = await testRes.json().catch(() => null);
                throw new Error(errorData?.detail || "Test generation failed");
            }

            const testData = await testRes.json();
            navigate(`/test/${testData.test_id}`);
        } catch (err) {
            console.error(err);
            alert(err instanceof Error ? err.message : "Test generation failed.");
        } finally {
            setLoadingAction(null);
        }
    };

    const handleGenerateMindMap = async () => {
        if (!auth.currentUser) return alert("Please log in first");

        setLoadingAction("mindmap");
        try {
            const docData = uploadedDoc || await uploadSource();
            if (!docData) return;

            const mindmapRes = await fetch(apiUrl("/tests/mindmap"), {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    user_id: auth.currentUser.uid,
                    doc_id: docData.doc_id
                })
            });

            if (!mindmapRes.ok) {
                throw new Error("Mind map generation failed");
            }

            const mindmapData = await mindmapRes.json();
            navigate(`/mindmap/${mindmapData.mindmap_id}`);
        } catch (err) {
            console.error(err);
            alert("Upload or mind map generation failed.");
        } finally {
            setLoadingAction(null);
        }
    };

    return (
        <PageTransition className="max-w-5xl mx-auto space-y-8">
            <motion.div initial="hidden" animate="visible" variants={itemVariants} className="text-center">
                <h1 className="text-4xl font-bold mb-4">Provide Study Content</h1>
                <p className="text-muted-foreground text-lg">Upload a PDF or share a URL, inspect the extracted topics and subtopics, then choose exactly what you want to practice.</p>
            </motion.div>

            <motion.div 
                initial="hidden"
                animate="visible"
                variants={itemVariants}
                className="premium-panel rounded-[2rem] overflow-hidden"
            >
                <div className="flex border-b">
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'pdf' ? 'bg-white/80 text-primary border-b-2 border-primary' : 'hover:bg-white/60 text-muted-foreground'}`}
                        onClick={() => setActiveTab("pdf")}
                    >
                        <FileText className="w-5 h-5 inline-block mr-2" /> PDF Document
                    </button>
                    <button
                        className={`flex-1 py-4 text-center font-medium transition-colors ${activeTab === 'url' ? 'bg-white/80 text-primary border-b-2 border-primary' : 'hover:bg-white/60 text-muted-foreground'}`}
                        onClick={() => setActiveTab("url")}
                    >
                        <LinkIcon className="w-5 h-5 inline-block mr-2" /> Webpage URL
                    </button>
                </div>

                <div className="p-8">
                    {activeTab === "pdf" ? (
                        <div className="border-2 border-dashed border-slate-300/70 rounded-2xl p-12 text-center bg-white/40 hover:bg-white/60 transition-colors group relative cursor-pointer">
                            <input type="file" accept=".pdf" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => setFile(e.target.files?.[0] || null)} />
                            <div className="flex flex-col items-center pointer-events-none">
                                <div className="p-4 rounded-full bg-primary/10 mb-4 group-hover:scale-110 transition-transform">
                                    <UploadCloud className="w-10 h-10 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">{file ? file.name : "Click or drag PDF to upload"}</h3>
                                <p className="text-sm text-muted-foreground">Max file size 50MB</p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <label className="block text-sm font-medium">Article or Wikipedia Link</label>
                            <input
                                type="url"
                                placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white/75 focus:ring-2 focus:ring-primary focus:outline-none transition-shadow"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                            />
                        </div>
                    )}

                    <div className="mt-8 space-y-6 text-left">
                        <div className="space-y-4">
                            <label className="block text-sm font-bold text-muted-foreground">Test Configuration</label>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Questions per test ({numQuestions})</label>
                                    <input
                                        type="range"
                                        min="3" max="20"
                                        value={numQuestions}
                                        onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                                        className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <p className="mt-2 text-xs text-muted-foreground">Topic coverage is tracked against an AI-estimated practice budget of roughly 30 questions across repeat attempts.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Difficulty</label>
                                    <select
                                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white/75 focus:ring-2 focus:ring-primary focus:outline-none"
                                        value={difficulty}
                                        onChange={(e) => setDifficulty(e.target.value)}
                                    >
                                        <option value="Easy">Easy</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hard">Hard</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-3">Question Types</label>
                            <div className="flex flex-wrap gap-3">
                                {[{ id: "mcq", label: "Multiple Choice" }, { id: "true_false", label: "True/False" }, { id: "short", label: "Short Answer" }, { id: "long", label: "Long Answer" }].map(t => (
                                    <label key={t.id} className="flex items-center gap-2 px-4 py-2 rounded-full border cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:bg-primary/10 has-[:checked]:border-primary has-[:checked]:text-primary select-none">
                                        <input
                                            type="checkbox"
                                            className="hidden"
                                            checked={questionTypes.includes(t.id)}
                                            onChange={() => handleTypeChange(t.id)}
                                        />
                                        <span className="text-sm font-bold">{t.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 mt-8">
                        <button
                            onClick={handleAnalyzeTopics}
                            disabled={loadingAction !== null}
                            className="flex-1 py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {loadingAction === "analyze" ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing...</> : "Upload & Analyze Topics"}
                        </button>
                        <button
                            onClick={handleGenerateMindMap}
                            disabled={loadingAction !== null}
                            className="flex-1 py-4 rounded-xl border-2 border-primary text-primary bg-white/70 font-bold hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                        >
                            {loadingAction === "mindmap" ? <><Loader2 className="w-5 h-5 animate-spin" /> Working...</> : "Generate Mind Map"}
                        </button>
                    </div>
                </div>
            </motion.div>

            {uploadedDoc && (
                <div className="premium-panel rounded-[2rem] p-4 md:p-8 space-y-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wider text-muted-foreground">Analyzed Content</p>
                            <h2 className="text-xl md:text-2xl font-bold">{uploadedDoc.title}</h2>
                            <p className="text-sm text-muted-foreground mt-1">Select topics to include in your practice test.</p>
                        </div>
                        <div className="rounded-2xl border border-primary/20 bg-white/70 px-4 py-2 text-sm text-primary font-bold self-start md:self-center">
                            {selectedTopics.length} topic{selectedTopics.length === 1 ? "" : "s"} selected
                        </div>
                    </div>

                    {uploadedDoc.topic_outline.length > 0 ? (
                        <motion.div 
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className="grid grid-cols-1 lg:grid-cols-2 gap-4"
                        >
                            {uploadedDoc.topic_outline.map(topic => {
                                const isSelected = selectedTopics.includes(topic.id);
                                return (
                                    <motion.button
                                        key={topic.id}
                                        variants={itemVariants}
                                        type="button"
                                        onClick={() => toggleTopic(topic.id)}
                                        className={`text-left p-4 md:p-5 rounded-2xl border transition-all flex flex-col gap-3 ${isSelected ? "border-primary bg-white/80 shadow-sm" : "border-slate-200/80 bg-white/45 hover:border-primary/40 hover:bg-white/70"}`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className="mt-1">
                                                    <CheckCircle2 className={`w-5 h-5 ${isSelected ? "text-primary" : "text-slate-300"}`} />
                                                </div>
                                                <h3 className="font-bold text-base md:text-lg leading-tight">{topic.name}</h3>
                                            </div>
                                            <div className="shrink-0 rounded-lg bg-primary/5 border border-primary/10 px-2 py-1 text-[10px] md:text-xs font-black text-primary uppercase">
                                                ~{topic.recommended_questions} Questions
                                            </div>
                                        </div>

                                        <div className="pl-8 space-y-3">
                                            {topic.summary && (
                                                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2 md:line-clamp-none">
                                                    {topic.summary}
                                                </p>
                                            )}
                                            
                                            {topic.subtopics?.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5">
                                                    {topic.subtopics.map((subtopic, index) => (
                                                        <span key={`${topic.id}-${index}`} className="rounded-md border border-slate-200/60 bg-white/60 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                                                            {subtopic}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                );
                            })}
                        </motion.div>
                    ) : (
                             <div className="rounded-2xl border border-dashed border-slate-300/70 bg-white/45 p-6 text-sm text-muted-foreground">
                            No structured topic outline was extracted for this content. You can still generate a general test, but topic-based progress tracking will be limited.
                        </div>
                    )}

                    <div className="flex flex-col gap-3 md:flex-row pt-4">
                        <div className="flex flex-row gap-2 md:contents">
                            <button
                                onClick={() => setSelectedTopics(uploadedDoc.topic_outline.map(topic => topic.id))}
                                className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-slate-200 bg-white/75 text-sm font-bold hover:bg-white transition-colors"
                            >
                                Select All
                            </button>
                            <button
                                onClick={() => setSelectedTopics([])}
                                className="flex-1 md:flex-none px-4 py-3 rounded-xl border border-slate-200 bg-white/75 text-sm font-bold hover:bg-white transition-colors"
                            >
                                Clear
                            </button>
                        </div>
                        <button
                            onClick={handleGenerateTest}
                            disabled={loadingAction !== null || (uploadedDoc.topic_outline.length > 0 && selectedTopics.length === 0)}
                            className="flex-[2] py-4 rounded-xl bg-primary text-primary-foreground font-black hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loadingAction === "test" ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</> : <><Target className="w-5 h-5" /> Generate Test for Selected Topics</>}
                        </button>
                    </div>
                </div>
            )}
        </PageTransition>
    );
}
