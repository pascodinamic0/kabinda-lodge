module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[project]/src/hooks/use-toast.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "reducer",
    ()=>reducer,
    "toast",
    ()=>toast,
    "useToast",
    ()=>useToast
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
const TOAST_LIMIT = 1;
const TOAST_REMOVE_DELAY = 1000000;
const actionTypes = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST"
};
let count = 0;
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER;
    return count.toString();
}
const toastTimeouts = new Map();
const addToRemoveQueue = (toastId)=>{
    if (toastTimeouts.has(toastId)) {
        return;
    }
    const timeout = setTimeout(()=>{
        toastTimeouts.delete(toastId);
        dispatch({
            type: "REMOVE_TOAST",
            toastId: toastId
        });
    }, TOAST_REMOVE_DELAY);
    toastTimeouts.set(toastId, timeout);
};
const reducer = (state, action)=>{
    switch(action.type){
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [
                    action.toast,
                    ...state.toasts
                ].slice(0, TOAST_LIMIT)
            };
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t)=>t.id === action.toast.id ? {
                        ...t,
                        ...action.toast
                    } : t)
            };
        case "DISMISS_TOAST":
            {
                const { toastId } = action;
                // ! Side effects ! - This could be extracted into a dismissToast() action,
                // but I'll keep it here for simplicity
                if (toastId) {
                    addToRemoveQueue(toastId);
                } else {
                    state.toasts.forEach((toast)=>{
                        addToRemoveQueue(toast.id);
                    });
                }
                return {
                    ...state,
                    toasts: state.toasts.map((t)=>t.id === toastId || toastId === undefined ? {
                            ...t,
                            open: false
                        } : t)
                };
            }
        case "REMOVE_TOAST":
            if (action.toastId === undefined) {
                return {
                    ...state,
                    toasts: []
                };
            }
            return {
                ...state,
                toasts: state.toasts.filter((t)=>t.id !== action.toastId)
            };
    }
};
const listeners = [];
let memoryState = {
    toasts: []
};
function dispatch(action) {
    memoryState = reducer(memoryState, action);
    listeners.forEach((listener)=>{
        listener(memoryState);
    });
}
function toast({ ...props }) {
    const id = genId();
    const update = (props)=>dispatch({
            type: "UPDATE_TOAST",
            toast: {
                ...props,
                id
            }
        });
    const dismiss = ()=>dispatch({
            type: "DISMISS_TOAST",
            toastId: id
        });
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
            open: true,
            onOpenChange: (open)=>{
                if (!open) dismiss();
            }
        }
    });
    return {
        id: id,
        dismiss,
        update
    };
}
function useToast() {
    const [state, setState] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"](memoryState);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"](()=>{
        listeners.push(setState);
        return ()=>{
            const index = listeners.indexOf(setState);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        };
    }, [
        state
    ]);
    return {
        ...state,
        toast,
        dismiss: (toastId)=>dispatch({
                type: "DISMISS_TOAST",
                toastId
            })
    };
}
;
}),
"[project]/src/lib/utils.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-ssr] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
}),
"[project]/src/components/ui/toast.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toast",
    ()=>Toast,
    "ToastAction",
    ()=>ToastAction,
    "ToastClose",
    ()=>ToastClose,
    "ToastDescription",
    ()=>ToastDescription,
    "ToastProvider",
    ()=>ToastProvider,
    "ToastTitle",
    ()=>ToastTitle,
    "ToastViewport",
    ()=>ToastViewport
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-toast/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/class-variance-authority/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__ = __turbopack_context__.i("[project]/node_modules/lucide-react/dist/esm/icons/x.js [app-ssr] (ecmascript) <export default as X>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/utils.ts [app-ssr] (ecmascript)");
;
;
;
;
;
;
const ToastProvider = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Provider"];
const ToastViewport = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 14,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastViewport.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Viewport"].displayName;
const toastVariants = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$class$2d$variance$2d$authority$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cva"])("group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full", {
    variants: {
        variant: {
            default: "border bg-background text-foreground",
            destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
        }
    },
    defaultVariants: {
        variant: "default"
    }
});
const Toast = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, variant, ...props }, ref)=>{
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])(toastVariants({
            variant
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 47,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
});
Toast.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Root"].displayName;
const ToastAction = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 60,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastAction.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Action"].displayName;
const ToastClose = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className),
        "toast-close": "",
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$lucide$2d$react$2f$dist$2f$esm$2f$icons$2f$x$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__default__as__X$3e$__["X"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/src/components/ui/toast.tsx",
            lineNumber: 84,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 75,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastClose.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Close"].displayName;
const ToastTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 93,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastTitle.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Title"].displayName;
const ToastDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$utils$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["cn"])("text-sm opacity-90", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/src/components/ui/toast.tsx",
        lineNumber: 105,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
ToastDescription.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$toast$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Description"].displayName;
;
}),
"[project]/src/components/ui/toaster.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Toaster",
    ()=>Toaster
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/hooks/use-toast.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/components/ui/toast.tsx [app-ssr] (ecmascript)");
"use client";
;
;
;
function Toaster() {
    const { toasts } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$hooks$2f$use$2d$toast$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useToast"])();
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastProvider"], {
        children: [
            toasts.map(function({ id, title, description, action, ...props }) {
                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Toast"], {
                    ...props,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-1",
                            children: [
                                title && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastTitle"], {
                                    children: title
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 22,
                                    columnNumber: 25
                                }, this),
                                description && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastDescription"], {
                                    children: description
                                }, void 0, false, {
                                    fileName: "[project]/src/components/ui/toaster.tsx",
                                    lineNumber: 24,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 21,
                            columnNumber: 13
                        }, this),
                        action,
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastClose"], {}, void 0, false, {
                            fileName: "[project]/src/components/ui/toaster.tsx",
                            lineNumber: 28,
                            columnNumber: 13
                        }, this)
                    ]
                }, id, true, {
                    fileName: "[project]/src/components/ui/toaster.tsx",
                    lineNumber: 20,
                    columnNumber: 11
                }, this);
            }),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$components$2f$ui$2f$toast$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ToastViewport"], {}, void 0, false, {
                fileName: "[project]/src/components/ui/toaster.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/src/components/ui/toaster.tsx",
        lineNumber: 17,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/integrations/supabase/client.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// This file is automatically generated. Do not edit it directly.
__turbopack_context__.s([
    "supabase",
    ()=>supabase
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/module/index.js [app-ssr] (ecmascript) <locals>");
;
const SUPABASE_URL = "https://xgcsmkapakcyqxzxpuqk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnY3Nta2FwYWtjeXF4enhwdXFrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzNTQ3NTEsImV4cCI6MjA2NzkzMDc1MX0.N2ZaSfNJ-xOVQbevNIG7GejZPGmpImGRGIXP4uvumew";
// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
// Create a safe storage adapter that works in both browser and SSR environments
const getStorage = ()=>{
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    // Return a no-op storage for SSR
    return {
        getItem: ()=>null,
        setItem: ()=>{},
        removeItem: ()=>{},
        clear: ()=>{}
    };
};
const supabase = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$module$2f$index$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    auth: {
        storage: getStorage(),
        persistSession: true,
        autoRefreshToken: true
    }
});
}),
"[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AuthProvider",
    ()=>AuthProvider,
    "useAuth",
    ()=>useAuth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/integrations/supabase/client.ts [app-ssr] (ecmascript)");
;
;
;
const AuthContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useAuth = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
const AuthProvider = ({ children })=>{
    const [user, setUser] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [session, setSession] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [userRole, setUserRole] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isOnline, setIsOnline] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(navigator.onLine);
    // Mobile session management utilities
    const isMobile = ()=>/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const checkStorageAvailability = ()=>{
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch  {
            return false;
        }
    };
    const proactiveSessionRefresh = async (session)=>{
        if (!session) return;
        const expiresAt = session.expires_at;
        const currentTime = Math.floor(Date.now() / 1000);
        const timeUntilExpiry = expiresAt - currentTime;
        // Refresh 5 minutes before expiry on mobile, 2 minutes on desktop
        const refreshThreshold = isMobile() ? 300 : 120;
        if (timeUntilExpiry < refreshThreshold && timeUntilExpiry > 0) {
            console.log('Proactively refreshing session...');
            await refreshSession();
        }
    };
    const fetchUserRole = async (userId)=>{
        try {
            const { data: userData, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('users').select('role').eq('id', userId).single();
            if (error) {
                console.error('Error fetching user role:', error);
                return null;
            }
            return userData?.role || null;
        } catch (error) {
            console.error('Error fetching user role:', error);
            return null;
        }
    };
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let isInitialized = false;
        let sessionRefreshInterval = null;
        // Mobile-specific event listeners
        const handleVisibilityChange = ()=>{
            if (document.visibilityState === 'visible' && session) {
                console.log('App became visible, validating session...');
                // Validate session when app becomes visible again
                setTimeout(()=>proactiveSessionRefresh(session), 100);
            }
        };
        const handleOnline = ()=>{
            setIsOnline(true);
            if (session) {
                console.log('Network restored, validating session...');
                setTimeout(()=>proactiveSessionRefresh(session), 100);
            }
        };
        const handleOffline = ()=>{
            setIsOnline(false);
            console.log('Network lost, session management paused...');
        };
        // Set up auth state listener
        const { data: { subscription } } = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.onAuthStateChange(async (event, session)=>{
            const isMobileDevice = isMobile();
            console.log(`Auth state changed (${isMobileDevice ? 'mobile' : 'desktop'}):`, event, session?.user?.email);
            // Prevent infinite loops during initialization
            if (event === 'INITIAL_SESSION' && isInitialized) {
                return;
            }
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                // Fetch user role using setTimeout to avoid blocking auth state change
                setTimeout(async ()=>{
                    const role = await fetchUserRole(session.user.id);
                    setUserRole(role);
                }, 0);
                // Set up proactive session refresh for mobile
                if (isMobileDevice && sessionRefreshInterval) {
                    clearInterval(sessionRefreshInterval);
                }
                if (isMobileDevice) {
                    sessionRefreshInterval = setInterval(()=>{
                        if (isOnline) {
                            proactiveSessionRefresh(session);
                        }
                    }, 60000); // Check every minute on mobile
                }
            } else {
                setUserRole(null);
                if (sessionRefreshInterval) {
                    clearInterval(sessionRefreshInterval);
                    sessionRefreshInterval = null;
                }
            }
            if (!isInitialized) {
                setLoading(false);
                isInitialized = true;
            }
        });
        // Check for existing session
        const initializeAuth = async ()=>{
            try {
                // Check storage availability for mobile browsers
                if (isMobile() && !checkStorageAvailability()) {
                    console.warn('Local storage not available on mobile browser');
                }
                const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                if (error) {
                    console.error('Error getting session:', error);
                    setLoading(false);
                    return;
                }
                setSession(session);
                setUser(session?.user ?? null);
                if (session?.user) {
                    const role = await fetchUserRole(session.user.id);
                    setUserRole(role);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally{
                setLoading(false);
            }
        };
        // Add mobile-specific event listeners
        if (isMobile()) {
            document.addEventListener('visibilitychange', handleVisibilityChange);
            window.addEventListener('online', handleOnline);
            window.addEventListener('offline', handleOffline);
        }
        initializeAuth();
        return ()=>{
            subscription.unsubscribe();
            if (sessionRefreshInterval) {
                clearInterval(sessionRefreshInterval);
            }
            if (isMobile()) {
                document.removeEventListener('visibilitychange', handleVisibilityChange);
                window.removeEventListener('online', handleOnline);
                window.removeEventListener('offline', handleOffline);
            }
        };
    }, []);
    const signUp = async (email, password, name, role = 'Guest')=>{
        const redirectUrl = `${window.location.origin}/kabinda-lodge`;
        try {
            // Check rate limit before attempting signup
            const { data: rateLimitOk, error: rateLimitError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('check_rate_limit', {
                p_identifier: email.trim(),
                p_attempt_type: 'signup',
                p_max_attempts: 3,
                p_window_minutes: 30
            });
            if (rateLimitError) {
                console.error('Rate limit check failed:', rateLimitError);
            // Continue with signup attempt even if rate limit check fails
            } else if (!rateLimitOk) {
                return {
                    error: new Error('Too many signup attempts. Please try again in 30 minutes.')
                };
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signUp({
                email: email.trim(),
                password,
                options: {
                    emailRedirectTo: redirectUrl,
                    data: {
                        name: name.trim(),
                        role
                    }
                }
            });
            if (error) {
                console.error('Sign up error:', error);
            }
            return {
                error
            };
        } catch (fetchError) {
            console.error('Sign up fetch error:', fetchError);
            return {
                error: fetchError
            };
        }
    };
    const signIn = async (email, password)=>{
        try {
            // Check rate limit before attempting login
            const { data: rateLimitOk, error: rateLimitError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].rpc('check_rate_limit', {
                p_identifier: email.trim(),
                p_attempt_type: 'login',
                p_max_attempts: 5,
                p_window_minutes: 15
            });
            if (rateLimitError) {
                console.error('Rate limit check failed:', rateLimitError);
            // Continue with login attempt even if rate limit check fails
            } else if (!rateLimitOk) {
                return {
                    error: new Error('Too many login attempts. Please try again in 15 minutes.')
                };
            }
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithPassword({
                email: email.trim(),
                password
            });
            if (error) {
                console.error('Sign in error:', error);
            }
            return {
                error
            };
        } catch (fetchError) {
            console.error('Sign in fetch error:', fetchError);
            return {
                error: fetchError
            };
        }
    };
    const signInWithGoogle = async ()=>{
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/kabinda-lodge`
                }
            });
            if (error) {
                console.error('Google sign in error:', error);
            }
            return {
                error
            };
        } catch (fetchError) {
            console.error('Google sign in fetch error:', fetchError);
            return {
                error: fetchError
            };
        }
    };
    const signOut = async ()=>{
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.signOut();
            if (error) {
                console.error('Sign out error:', error);
            }
            // Clear local state
            setUser(null);
            setSession(null);
            setUserRole(null);
        } catch (error) {
            console.error('Sign out error:', error);
        }
    };
    const refreshSession = async ()=>{
        try {
            // Add retry logic for mobile networks
            let retryCount = 0;
            const maxRetries = isMobile() ? 3 : 1;
            while(retryCount <= maxRetries){
                try {
                    const { data: { session }, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.refreshSession();
                    if (error) {
                        throw error;
                    }
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        const role = await fetchUserRole(session.user.id);
                        setUserRole(role);
                    }
                    console.log('Session refreshed successfully');
                    return;
                } catch (error) {
                    retryCount++;
                    if (retryCount > maxRetries) {
                        throw error;
                    }
                    // Exponential backoff for retries
                    const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
                    console.log(`Session refresh failed, retrying in ${delay}ms... (attempt ${retryCount}/${maxRetries})`);
                    await new Promise((resolve)=>setTimeout(resolve, delay));
                }
            }
        } catch (error) {
            console.error('Error refreshing session after retries:', error);
            // On mobile, if session refresh fails completely, try to re-validate
            if (isMobile()) {
                console.log('Attempting to re-validate session on mobile...');
                try {
                    const { data: { session } } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].auth.getSession();
                    if (!session) {
                        console.log('No valid session found, user needs to re-authenticate');
                        setUser(null);
                        setSession(null);
                        setUserRole(null);
                    }
                } catch (revalidateError) {
                    console.error('Session re-validation failed:', revalidateError);
                }
            }
        }
    };
    const value = {
        user,
        session,
        userRole,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        refreshSession
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(AuthContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/AuthContext.tsx",
        lineNumber: 520,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),
"[project]/src/contexts/LanguageContext.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "LanguageProvider",
    ()=>LanguageProvider,
    "useLanguage",
    ()=>useLanguage
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/integrations/supabase/client.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)");
;
;
;
;
const LanguageContext = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["createContext"])(undefined);
const useLanguage = ()=>{
    const context = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useContext"])(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
};
// Comprehensive default translations
const defaultTranslations = {
    fr: {
        // Navigation
        'nav.home': 'Accueil',
        'nav.rooms': 'Chambres',
        'nav.conference': 'Salle de Conférence',
        'nav.about': 'À Propos',
        'nav.restaurant': 'Restaurant',
        'nav.contact': 'Contact',
        'nav.dashboard': 'Tableau de Bord',
        'nav.bookings': 'Réservations',
        'nav.users': 'Utilisateurs',
        'nav.reports': 'Rapports',
        'nav.settings': 'Paramètres',
        // Common Actions
        'action.save': 'Enregistrer',
        'action.cancel': 'Annuler',
        'action.delete': 'Supprimer',
        'action.edit': 'Modifier',
        'action.add': 'Ajouter',
        'action.view': 'Voir',
        'action.close': 'Fermer',
        'action.confirm': 'Confirmer',
        'action.back': 'Retour',
        'action.next': 'Suivant',
        'action.previous': 'Précédent',
        'action.submit': 'Soumettre',
        'action.search': 'Rechercher',
        'action.filter': 'Filtrer',
        'action.sort': 'Trier',
        'action.refresh': 'Actualiser',
        'action.print': 'Imprimer',
        'action.download': 'Télécharger',
        'action.upload': 'Téléverser',
        // Status
        'status.pending': 'En Attente',
        'status.approved': 'Approuvé',
        'status.rejected': 'Rejeté',
        'status.completed': 'Terminé',
        'status.cancelled': 'Annulé',
        'status.active': 'Actif',
        'status.inactive': 'Inactif',
        'status.available': 'Disponible',
        'status.occupied': 'Occupé',
        'status.maintenance': 'Maintenance',
        'status.cleaning': 'Nettoyage',
        // Dashboard
        'dashboard.welcome': 'Bienvenue',
        'dashboard.overview': 'Aperçu',
        'dashboard.stats': 'Statistiques',
        'dashboard.recent_activity': 'Activité Récente',
        'dashboard.quick_actions': 'Actions Rapides',
        'dashboard.total_users': 'Total Utilisateurs',
        'dashboard.total_rooms': 'Total Chambres',
        'dashboard.total_bookings': 'Total Réservations',
        'dashboard.total_revenue': 'Revenu Total',
        'dashboard.pending_orders': 'Commandes en Attente',
        'dashboard.available_tables': 'Tables Disponibles',
        'dashboard.active_menu_items': 'Articles de Menu Actifs',
        // Booking
        'booking.new': 'Nouvelle Réservation',
        'booking.edit': 'Modifier Réservation',
        'booking.details': 'Détails de Réservation',
        'booking.confirm': 'Confirmer Réservation',
        'booking.cancel': 'Annuler Réservation',
        'booking.check_in': 'Arrivée',
        'booking.check_out': 'Départ',
        'booking.guest_name': 'Nom du Client',
        'booking.guest_email': 'Email du Client',
        'booking.guest_phone': 'Téléphone du Client',
        'booking.room_type': 'Type de Chambre',
        'booking.room_number': 'Numéro de Chambre',
        'booking.nights': 'Nuits',
        'booking.total_amount': 'Montant Total',
        'booking.payment_method': 'Méthode de Paiement',
        'booking.transaction_ref': 'Référence Transaction',
        'booking.booking_id': 'ID de Réservation',
        'booking.booking_date': 'Date de Réservation',
        'booking.booking_status': 'Statut de Réservation',
        // Room
        'room.available': 'Disponible',
        'room.occupied': 'Occupée',
        'room.maintenance': 'Maintenance',
        'room.cleaning': 'Nettoyage',
        'room.standard': 'Standard',
        'room.deluxe': 'Deluxe',
        'room.suite': 'Suite',
        'room.presidential': 'Présidentielle',
        'room.price_per_night': 'Prix par Nuit',
        'room.amenities': 'Équipements',
        'room.description': 'Description',
        'room.capacity': 'Capacité',
        'room.size': 'Taille',
        'room.view': 'Vue',
        // Restaurant
        'restaurant.menu': 'Menu',
        'restaurant.order': 'Commande',
        'restaurant.orders': 'Commandes',
        'restaurant.new_order': 'Nouvelle Commande',
        'restaurant.order_details': 'Détails de Commande',
        'restaurant.order_status': 'Statut de Commande',
        'restaurant.order_total': 'Total de Commande',
        'restaurant.table_number': 'Numéro de Table',
        'restaurant.item_name': 'Nom de l\'Article',
        'restaurant.item_price': 'Prix de l\'Article',
        'restaurant.item_quantity': 'Quantité',
        'restaurant.item_total': 'Total Article',
        'restaurant.subtotal': 'Sous-total',
        'restaurant.tax': 'Taxe',
        'restaurant.discount': 'Remise',
        'restaurant.grand_total': 'Total Général',
        'restaurant.payment_method': 'Méthode de Paiement',
        'restaurant.cash': 'Espèces',
        'restaurant.card': 'Carte',
        'restaurant.mobile_money': 'Mobile Money',
        // Conference Room
        'conference.room': 'Salle de Conférence',
        'conference.rooms': 'Salles de Conférence',
        'conference.booking': 'Réservation Salle',
        'conference.bookings': 'Réservations Salles',
        'conference.room_name': 'Nom de la Salle',
        'conference.capacity': 'Capacité',
        'conference.price_per_day': 'Prix par Jour',
        'conference.booking_date': 'Date de Réservation',
        'conference.start_time': 'Heure de Début',
        'conference.end_time': 'Heure de Fin',
        'conference.attendees': 'Participants',
        'conference.notes': 'Notes',
        // Receipt
        'receipt.title': 'FACTURE',
        'receipt.company_name': 'KABINDA LODGE',
        'receipt.booking_receipt': 'FACTURE',
        'receipt.receipt_date': 'Date de Reçu',
        'receipt.booking_id': 'ID de Réservation',
        'receipt.guest_name': 'Nom du Client',
        'receipt.guest_email': 'Email du Client',
        'receipt.guest_phone': 'Téléphone du Client',
        'receipt.room_name': 'Nom de la Chambre',
        'receipt.room_type': 'Type de Chambre',
        'receipt.check_in': 'Arrivée',
        'receipt.check_out': 'Départ',
        'receipt.nights': 'Nuits',
        'receipt.room_price': 'Prix de la Chambre',
        'receipt.total_amount': 'Montant Total',
        'receipt.payment_method': 'Méthode de Paiement',
        'receipt.transaction_ref': 'Référence Transaction',
        'receipt.promotion': 'Promotion',
        'receipt.discount': 'Remise',
        'receipt.subtotal': 'Sous-total',
        'receipt.tax': 'Taxe',
        'receipt.grand_total': 'Total Général',
        'receipt.thank_you': 'Merci d\'avoir choisi Kabinda Lodge. Nous espérons que vous apprécierez votre séjour !',
        'receipt.contact_info': 'Pour toute question, veuillez contacter notre réception.',
        'receipt.company_tagline': 'Kabinda Lodge - Expérience d\'Hospitalité de Luxe',
        // Restaurant Receipt
        'restaurant_receipt.title': 'REÇU DE RESTAURANT',
        'restaurant_receipt.order_receipt': 'REÇU DE COMMANDE',
        'restaurant_receipt.order_id': 'ID de Commande',
        'restaurant_receipt.order_date': 'Date de Commande',
        'restaurant_receipt.table_number': 'Numéro de Table',
        'restaurant_receipt.items': 'Articles',
        'restaurant_receipt.quantity': 'Quantité',
        'restaurant_receipt.price': 'Prix',
        'restaurant_receipt.total': 'Total',
        'restaurant_receipt.thank_you': 'Merci pour votre commande !',
        // User Management
        'user.profile': 'Profil',
        'user.settings': 'Paramètres',
        'user.logout': 'Déconnexion',
        'user.login': 'Connexion',
        'user.register': 'Inscription',
        'user.email': 'Email',
        'user.password': 'Mot de Passe',
        'user.confirm_password': 'Confirmer Mot de Passe',
        'user.first_name': 'Prénom',
        'user.last_name': 'Nom',
        'user.phone': 'Téléphone',
        'user.role': 'Rôle',
        'user.admin': 'Administrateur',
        'user.receptionist': 'Réceptionniste',
        'user.restaurant_lead': 'Chef de Restaurant',
        'user.kitchen': 'Cuisine',
        'user.super_admin': 'Super Administrateur',
        // Messages
        'message.success': 'Succès',
        'message.error': 'Erreur',
        'message.warning': 'Avertissement',
        'message.info': 'Information',
        'message.confirm': 'Confirmer',
        'message.cancel': 'Annuler',
        'message.yes': 'Oui',
        'message.no': 'Non',
        'message.ok': 'OK',
        'message.loading': 'Chargement...',
        'message.saving': 'Enregistrement...',
        'message.deleting': 'Suppression...',
        'message.please_wait': 'Veuillez patienter...',
        // Form Labels
        'form.required': 'Requis',
        'form.optional': 'Optionnel',
        'form.email': 'Adresse Email',
        'form.password': 'Mot de Passe',
        'form.confirm_password': 'Confirmer Mot de Passe',
        'form.first_name': 'Prénom',
        'form.last_name': 'Nom',
        'form.phone': 'Téléphone',
        'form.address': 'Adresse',
        'form.city': 'Ville',
        'form.country': 'Pays',
        'form.postal_code': 'Code Postal',
        'form.notes': 'Notes',
        'form.description': 'Description',
        'form.title': 'Titre',
        'form.category': 'Catégorie',
        'form.price': 'Prix',
        'form.quantity': 'Quantité',
        'form.date': 'Date',
        'form.time': 'Heure',
        'form.start_date': 'Date de Début',
        'form.end_date': 'Date de Fin',
        // Time
        'time.today': 'Aujourd\'hui',
        'time.yesterday': 'Hier',
        'time.tomorrow': 'Demain',
        'time.this_week': 'Cette Semaine',
        'time.last_week': 'Semaine Dernière',
        'time.this_month': 'Ce Mois',
        'time.last_month': 'Mois Dernier',
        'time.this_year': 'Cette Année',
        'time.last_year': 'Année Dernière',
        // Months
        'month.january': 'Janvier',
        'month.february': 'Février',
        'month.march': 'Mars',
        'month.april': 'Avril',
        'month.may': 'Mai',
        'month.june': 'Juin',
        'month.july': 'Juillet',
        'month.august': 'Août',
        'month.september': 'Septembre',
        'month.october': 'Octobre',
        'month.november': 'Novembre',
        'month.december': 'Décembre',
        // Days
        'day.monday': 'Lundi',
        'day.tuesday': 'Mardi',
        'day.wednesday': 'Mercredi',
        'day.thursday': 'Jeudi',
        'day.friday': 'Vendredi',
        'day.saturday': 'Samedi',
        'day.sunday': 'Dimanche',
        // Errors
        'error.general': 'Une erreur s\'est produite',
        'error.network': 'Erreur de réseau',
        'error.unauthorized': 'Non autorisé',
        'error.forbidden': 'Accès interdit',
        'error.not_found': 'Page non trouvée',
        'error.server_error': 'Erreur du serveur',
        'error.validation': 'Erreur de validation',
        'error.required_field': 'Ce champ est requis',
        'error.invalid_email': 'Email invalide',
        'error.invalid_phone': 'Numéro de téléphone invalide',
        'error.password_mismatch': 'Les mots de passe ne correspondent pas',
        'error.invalid_credentials': 'Identifiants invalides',
        // Success
        'success.saved': 'Enregistré avec succès',
        'success.deleted': 'Supprimé avec succès',
        'success.updated': 'Mis à jour avec succès',
        'success.created': 'Créé avec succès',
        'success.booking_confirmed': 'Réservation confirmée',
        'success.order_placed': 'Commande passée',
        'success.payment_received': 'Paiement reçu',
        // Content
        'content.not_available': 'Contenu Non Disponible',
        'content.load_error': 'Impossible de charger le contenu. Veuillez réessayer plus tard.',
        'content.no_data': 'Aucune donnée disponible',
        'content.loading': 'Chargement...',
        // Database Reset
        'reset.title': 'Réinitialisation de Base de Données',
        'reset.description': 'Effacer toutes les données opérationnelles tout en préservant la configuration système',
        'reset.warning': '⚠️ Opération Critique',
        'reset.warning_text': 'Cela supprimera définitivement toutes les données opérationnelles incluant :',
        'reset.will_delete': '• Toutes les réservations de chambres',
        'reset.will_delete_orders': '• Toutes les commandes de restaurant',
        'reset.will_delete_conference': '• Toutes les réservations de salles de conférence',
        'reset.will_delete_services': '• Toutes les demandes de service',
        'reset.will_delete_feedback': '• Tous les commentaires clients',
        'reset.will_delete_notifications': '• Toutes les notifications',
        'reset.preserved': 'Préservé :',
        'reset.preserved_text': 'Configurations de chambres, articles de menu, équipements, données de salles de conférence et paramètres système.',
        'reset.confirm_title': 'Confirmer la Réinitialisation',
        'reset.confirm_text': 'Cette action ne peut pas être annulée. Toutes les données opérationnelles seront définitivement supprimées.',
        'reset.type_delete': 'Tapez "delete" pour confirmer :',
        'reset.button': 'Réinitialiser Base de Données',
        'reset.loading': 'Réinitialisation...',
        'reset.success': 'Réinitialisation Terminée',
        'reset.success_text': 'Toutes les données opérationnelles ont été effacées. Les données de configuration système ont été préservées.',
        'reset.failed': 'Échec de la Réinitialisation',
        'reset.failed_text': 'Une erreur s\'est produite lors de la réinitialisation de la base de données. Veuillez réessayer.',
        'reset.invalid_confirmation': 'Confirmation Invalide',
        'reset.invalid_text': 'Veuillez taper "delete" exactement pour confirmer la réinitialisation',
        // System
        'system.overview': 'Aperçu du Système',
        'system.status': 'Statut de Base de Données',
        'system.operational': 'Opérationnel',
        'system.last_reset': 'Dernière Réinitialisation',
        'system.never': 'Jamais',
        'system.version': 'Version du Système',
        'system.important_notes': 'Notes Importantes',
        'system.reset_usage': '• Utilisez la fonction de réinitialisation uniquement au début des opérations',
        'system.data_cleared': '• Toutes les données opérationnelles seront effacées mais la configuration système préservée',
        'system.irreversible': '• Cette action est irréversible et nécessite une confirmation',
        'system.backup': '• Considérez sauvegarder les données avant la réinitialisation si nécessaire'
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.rooms': 'Rooms',
        'nav.conference': 'Conference Room',
        'nav.about': 'About',
        'nav.restaurant': 'Restaurant',
        'nav.contact': 'Contact',
        'nav.dashboard': 'Dashboard',
        'nav.bookings': 'Bookings',
        'nav.users': 'Users',
        'nav.reports': 'Reports',
        'nav.settings': 'Settings',
        // Common Actions
        'action.save': 'Save',
        'action.cancel': 'Cancel',
        'action.delete': 'Delete',
        'action.edit': 'Edit',
        'action.add': 'Add',
        'action.view': 'View',
        'action.close': 'Close',
        'action.confirm': 'Confirm',
        'action.back': 'Back',
        'action.next': 'Next',
        'action.previous': 'Previous',
        'action.submit': 'Submit',
        'action.search': 'Search',
        'action.filter': 'Filter',
        'action.sort': 'Sort',
        'action.refresh': 'Refresh',
        'action.print': 'Print',
        'action.download': 'Download',
        'action.upload': 'Upload',
        // Status
        'status.pending': 'Pending',
        'status.approved': 'Approved',
        'status.rejected': 'Rejected',
        'status.completed': 'Completed',
        'status.cancelled': 'Cancelled',
        'status.active': 'Active',
        'status.inactive': 'Inactive',
        'status.available': 'Available',
        'status.occupied': 'Occupied',
        'status.maintenance': 'Maintenance',
        'status.cleaning': 'Cleaning',
        // Dashboard
        'dashboard.welcome': 'Welcome',
        'dashboard.overview': 'Overview',
        'dashboard.stats': 'Statistics',
        'dashboard.recent_activity': 'Recent Activity',
        'dashboard.quick_actions': 'Quick Actions',
        'dashboard.total_users': 'Total Users',
        'dashboard.total_rooms': 'Total Rooms',
        'dashboard.total_bookings': 'Total Bookings',
        'dashboard.total_revenue': 'Total Revenue',
        'dashboard.pending_orders': 'Pending Orders',
        'dashboard.available_tables': 'Available Tables',
        'dashboard.active_menu_items': 'Active Menu Items',
        // Booking
        'booking.new': 'New Booking',
        'booking.edit': 'Edit Booking',
        'booking.details': 'Booking Details',
        'booking.confirm': 'Confirm Booking',
        'booking.cancel': 'Cancel Booking',
        'booking.check_in': 'Check In',
        'booking.check_out': 'Check Out',
        'booking.guest_name': 'Guest Name',
        'booking.guest_email': 'Guest Email',
        'booking.guest_phone': 'Guest Phone',
        'booking.room_type': 'Room Type',
        'booking.room_number': 'Room Number',
        'booking.nights': 'Nights',
        'booking.total_amount': 'Total Amount',
        'booking.payment_method': 'Payment Method',
        'booking.transaction_ref': 'Transaction Reference',
        'booking.booking_id': 'Booking ID',
        'booking.booking_date': 'Booking Date',
        'booking.booking_status': 'Booking Status',
        // Room
        'room.available': 'Available',
        'room.occupied': 'Occupied',
        'room.maintenance': 'Maintenance',
        'room.cleaning': 'Cleaning',
        'room.standard': 'Standard',
        'room.deluxe': 'Deluxe',
        'room.suite': 'Suite',
        'room.presidential': 'Presidential',
        'room.price_per_night': 'Price per Night',
        'room.amenities': 'Amenities',
        'room.description': 'Description',
        'room.capacity': 'Capacity',
        'room.size': 'Size',
        'room.view': 'View',
        // Restaurant
        'restaurant.menu': 'Menu',
        'restaurant.order': 'Order',
        'restaurant.orders': 'Orders',
        'restaurant.new_order': 'New Order',
        'restaurant.order_details': 'Order Details',
        'restaurant.order_status': 'Order Status',
        'restaurant.order_total': 'Order Total',
        'restaurant.table_number': 'Table Number',
        'restaurant.item_name': 'Item Name',
        'restaurant.item_price': 'Item Price',
        'restaurant.item_quantity': 'Quantity',
        'restaurant.item_total': 'Item Total',
        'restaurant.subtotal': 'Subtotal',
        'restaurant.tax': 'Tax',
        'restaurant.discount': 'Discount',
        'restaurant.grand_total': 'Grand Total',
        'restaurant.payment_method': 'Payment Method',
        'restaurant.cash': 'Cash',
        'restaurant.card': 'Card',
        'restaurant.mobile_money': 'Mobile Money',
        // Conference Room
        'conference.room': 'Conference Room',
        'conference.rooms': 'Conference Rooms',
        'conference.booking': 'Conference Booking',
        'conference.bookings': 'Conference Bookings',
        'conference.room_name': 'Room Name',
        'conference.capacity': 'Capacity',
        'conference.price_per_day': 'Price per Day',
        'conference.booking_date': 'Booking Date',
        'conference.start_time': 'Start Time',
        'conference.end_time': 'End Time',
        'conference.attendees': 'Attendees',
        'conference.notes': 'Notes',
        // Receipt
        'receipt.title': 'BOOKING RECEIPT',
        'receipt.company_name': 'KABINDA LODGE',
        'receipt.booking_receipt': 'BOOKING RECEIPT',
        'receipt.receipt_date': 'Receipt Date',
        'receipt.booking_id': 'Booking ID',
        'receipt.guest_name': 'Guest Name',
        'receipt.guest_email': 'Guest Email',
        'receipt.guest_phone': 'Guest Phone',
        'receipt.room_name': 'Room Name',
        'receipt.room_type': 'Room Type',
        'receipt.check_in': 'Check In',
        'receipt.check_out': 'Check Out',
        'receipt.nights': 'Nights',
        'receipt.room_price': 'Room Price',
        'receipt.total_amount': 'Total Amount',
        'receipt.payment_method': 'Payment Method',
        'receipt.transaction_ref': 'Transaction Reference',
        'receipt.promotion': 'Promotion',
        'receipt.discount': 'Discount',
        'receipt.subtotal': 'Subtotal',
        'receipt.tax': 'Tax',
        'receipt.grand_total': 'Grand Total',
        'receipt.thank_you': 'Thank you for choosing Kabinda Lodge. We hope you enjoy your stay!',
        'receipt.contact_info': 'For any inquiries, please contact our reception desk.',
        'receipt.company_tagline': 'Kabinda Lodge - Luxury Hospitality Experience',
        // Restaurant Receipt
        'restaurant_receipt.title': 'RESTAURANT RECEIPT',
        'restaurant_receipt.order_receipt': 'ORDER RECEIPT',
        'restaurant_receipt.order_id': 'Order ID',
        'restaurant_receipt.order_date': 'Order Date',
        'restaurant_receipt.table_number': 'Table Number',
        'restaurant_receipt.items': 'Items',
        'restaurant_receipt.quantity': 'Quantity',
        'restaurant_receipt.price': 'Price',
        'restaurant_receipt.total': 'Total',
        'restaurant_receipt.thank_you': 'Thank you for your order!',
        // User Management
        'user.profile': 'Profile',
        'user.settings': 'Settings',
        'user.logout': 'Logout',
        'user.login': 'Login',
        'user.register': 'Register',
        'user.email': 'Email',
        'user.password': 'Password',
        'user.confirm_password': 'Confirm Password',
        'user.first_name': 'First Name',
        'user.last_name': 'Last Name',
        'user.phone': 'Phone',
        'user.role': 'Role',
        'user.admin': 'Admin',
        'user.receptionist': 'Receptionist',
        'user.restaurant_lead': 'Restaurant Lead',
        'user.kitchen': 'Kitchen',
        'user.super_admin': 'Super Admin',
        // Messages
        'message.success': 'Success',
        'message.error': 'Error',
        'message.warning': 'Warning',
        'message.info': 'Information',
        'message.confirm': 'Confirm',
        'message.cancel': 'Cancel',
        'message.yes': 'Yes',
        'message.no': 'No',
        'message.ok': 'OK',
        'message.loading': 'Loading...',
        'message.saving': 'Saving...',
        'message.deleting': 'Deleting...',
        'message.please_wait': 'Please wait...',
        // Form Labels
        'form.required': 'Required',
        'form.optional': 'Optional',
        'form.email': 'Email Address',
        'form.password': 'Password',
        'form.confirm_password': 'Confirm Password',
        'form.first_name': 'First Name',
        'form.last_name': 'Last Name',
        'form.phone': 'Phone',
        'form.address': 'Address',
        'form.city': 'City',
        'form.country': 'Country',
        'form.postal_code': 'Postal Code',
        'form.notes': 'Notes',
        'form.description': 'Description',
        'form.title': 'Title',
        'form.category': 'Category',
        'form.price': 'Price',
        'form.quantity': 'Quantity',
        'form.date': 'Date',
        'form.time': 'Time',
        'form.start_date': 'Start Date',
        'form.end_date': 'End Date',
        // Time
        'time.today': 'Today',
        'time.yesterday': 'Yesterday',
        'time.tomorrow': 'Tomorrow',
        'time.this_week': 'This Week',
        'time.last_week': 'Last Week',
        'time.this_month': 'This Month',
        'time.last_month': 'Last Month',
        'time.this_year': 'This Year',
        'time.last_year': 'Last Year',
        // Months
        'month.january': 'January',
        'month.february': 'February',
        'month.march': 'March',
        'month.april': 'April',
        'month.may': 'May',
        'month.june': 'June',
        'month.july': 'July',
        'month.august': 'August',
        'month.september': 'September',
        'month.october': 'October',
        'month.november': 'November',
        'month.december': 'December',
        // Days
        'day.monday': 'Monday',
        'day.tuesday': 'Tuesday',
        'day.wednesday': 'Wednesday',
        'day.thursday': 'Thursday',
        'day.friday': 'Friday',
        'day.saturday': 'Saturday',
        'day.sunday': 'Sunday',
        // Errors
        'error.general': 'An error occurred',
        'error.network': 'Network error',
        'error.unauthorized': 'Unauthorized',
        'error.forbidden': 'Access forbidden',
        'error.not_found': 'Page not found',
        'error.server_error': 'Server error',
        'error.validation': 'Validation error',
        'error.required_field': 'This field is required',
        'error.invalid_email': 'Invalid email',
        'error.invalid_phone': 'Invalid phone number',
        'error.password_mismatch': 'Passwords do not match',
        'error.invalid_credentials': 'Invalid credentials',
        // Success
        'success.saved': 'Saved successfully',
        'success.deleted': 'Deleted successfully',
        'success.updated': 'Updated successfully',
        'success.created': 'Created successfully',
        'success.booking_confirmed': 'Booking confirmed',
        'success.order_placed': 'Order placed',
        'success.payment_received': 'Payment received',
        // Content
        'content.not_available': 'Content Not Available',
        'content.load_error': 'Unable to load content. Please try again later.',
        'content.no_data': 'No data available',
        'content.loading': 'Loading...',
        // Database Reset
        'reset.title': 'Database Reset',
        'reset.description': 'Clear all operational data while preserving system configuration',
        'reset.warning': '⚠️ Critical Operation',
        'reset.warning_text': 'This will permanently delete all operational data including:',
        'reset.will_delete': '• All room bookings and reservations',
        'reset.will_delete_orders': '• All restaurant orders and payments',
        'reset.will_delete_conference': '• All conference room bookings',
        'reset.will_delete_services': '• All service requests and maintenance records',
        'reset.will_delete_feedback': '• All guest feedback and reviews',
        'reset.will_delete_notifications': '• All notifications and system logs',
        'reset.preserved': 'Preserved:',
        'reset.preserved_text': 'Room configurations, menu items, amenities, conference room data, and system settings.',
        'reset.confirm_title': 'Confirm Database Reset',
        'reset.confirm_text': 'This action cannot be undone. All operational data will be permanently deleted.',
        'reset.type_delete': 'Type "delete" to confirm:',
        'reset.button': 'Reset Database',
        'reset.loading': 'Resetting...',
        'reset.success': 'Database Reset Complete',
        'reset.success_text': 'All operational data has been cleared. System configuration data has been preserved.',
        'reset.failed': 'Reset Failed',
        'reset.failed_text': 'An error occurred while resetting the database. Please try again.',
        'reset.invalid_confirmation': 'Invalid Confirmation',
        'reset.invalid_text': 'Please type "delete" exactly to confirm the reset',
        // System
        'system.overview': 'System Overview',
        'system.status': 'Database Status',
        'system.operational': 'Operational',
        'system.last_reset': 'Last Reset',
        'system.never': 'Never',
        'system.version': 'System Version',
        'system.important_notes': 'Important Notes',
        'system.reset_usage': '• Use the database reset feature only when starting operations',
        'system.data_cleared': '• All operational data will be cleared but system configuration preserved',
        'system.irreversible': '• This action is irreversible and requires confirmation',
        'system.backup': '• Consider backing up data before reset if needed'
    }
};
const LanguageProvider = ({ children })=>{
    const { user } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const [currentLanguage, setCurrentLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('fr');
    const [translations, setTranslations] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [isLoading, setIsLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [isLanguageReady, setIsLanguageReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [canChangeLanguage, setCanChangeLanguage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [supportedLanguages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([
        'fr',
        'en'
    ]);
    // Check user role for language change permission
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (user) {
            const checkUserRole = async ()=>{
                try {
                    const { data: userData } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('users').select('role').eq('id', user.id).single();
                    setCanChangeLanguage(userData?.role === 'SuperAdmin');
                } catch (error) {
                    console.error('Error checking user role:', error);
                    setCanChangeLanguage(false);
                }
            };
            checkUserRole();
        } else {
            setCanChangeLanguage(false);
        }
    }, [
        user
    ]);
    // Initialize language from system setting
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const loadSystemLanguage = async ()=>{
            try {
                const { data } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('app_settings').select('value').eq('key', 'system_default_language').is('user_id', null).maybeSingle();
                let systemLanguage = 'fr';
                if (data?.value && typeof data.value === 'string') {
                    try {
                        // Try to parse as JSON first (in case it's stored as JSON string)
                        const parsed = JSON.parse(data.value);
                        systemLanguage = parsed === 'fr' || parsed === 'en' ? parsed : 'fr';
                    } catch  {
                        // If parsing fails, use the value directly (it's already a plain string)
                        systemLanguage = data.value === 'fr' || data.value === 'en' ? data.value : 'fr';
                    }
                }
                setCurrentLanguage(systemLanguage);
            } catch (error) {
                console.error('Error loading system language:', error);
                setCurrentLanguage('fr'); // Default fallback
            }
        };
        loadSystemLanguage();
    }, []);
    // Set up real-time subscription for system language changes
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const subscription = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].channel('system-language-changes').on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'app_settings',
            filter: 'key=eq.system_default_language'
        }, (payload)=>{
            if (payload.new && payload.new.value && typeof payload.new.value === 'string') {
                try {
                    // Try to parse as JSON first (in case it's stored as JSON string)
                    const parsed = JSON.parse(payload.new.value);
                    const newLanguage = parsed === 'fr' || parsed === 'en' ? parsed : 'fr';
                    setCurrentLanguage(newLanguage);
                } catch  {
                    // If parsing fails, use the value directly (it's already a plain string)
                    const newLanguage = payload.new.value === 'fr' || payload.new.value === 'en' ? payload.new.value : 'fr';
                    setCurrentLanguage(newLanguage);
                }
            }
        }).subscribe();
        return ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].removeChannel(subscription);
        };
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        // Load translations for current language
        const loadTranslations = async ()=>{
            setIsLoading(true);
            try {
                // First, load from database
                const { data, error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('translations').select('key, value').eq('language', currentLanguage);
                if (error) {
                    console.warn('Failed to load translations from database:', error);
                }
                // Start with default translations
                const translationMap = {
                    ...defaultTranslations[currentLanguage]
                };
                // Override with database translations if available
                if (data && data.length > 0) {
                    data.forEach((item)=>{
                        translationMap[item.key] = item.value;
                    });
                }
                // Fallback to English if French translations are missing
                if (currentLanguage === 'fr') {
                    const missingKeys = Object.keys(defaultTranslations.en).filter((key)=>!translationMap[key]);
                    missingKeys.forEach((key)=>{
                        translationMap[key] = defaultTranslations.en[key];
                    });
                }
                setTranslations(translationMap);
                setIsLanguageReady(true);
            } catch (error) {
                console.error('Failed to load translations:', error);
                // Fallback to default translations
                setTranslations(defaultTranslations[currentLanguage]);
                setIsLanguageReady(true);
            } finally{
                setIsLoading(false);
            }
        };
        loadTranslations();
    }, [
        currentLanguage
    ]);
    // Set system language function (SuperAdmin only)
    const setSystemLanguage = async (language)=>{
        if (!canChangeLanguage) {
            console.error('Access denied: Only SuperAdmin can change system language');
            return;
        }
        try {
            const { error } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from('app_settings').update({
                value: JSON.stringify(language)
            }).eq('key', 'system_default_language').is('user_id', null);
            if (error) throw error;
        // Language will be updated via real-time subscription
        } catch (error) {
            console.error('Error updating system language:', error);
        }
    };
    const t = (key, fallback)=>{
        // Return translation if available
        if (translations[key]) {
            return translations[key];
        }
        // Return fallback if provided
        if (fallback) {
            return fallback;
        }
        // Return key if no translation found
        return key;
    };
    const value = {
        currentLanguage,
        setSystemLanguage,
        translations,
        t,
        isLoading,
        supportedLanguages,
        isLanguageReady,
        canChangeLanguage
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(LanguageContext.Provider, {
        value: value,
        children: children
    }, void 0, false, {
        fileName: "[project]/src/contexts/LanguageContext.tsx",
        lineNumber: 902,
        columnNumber: 5
    }, ("TURBOPACK compile-time value", void 0));
};
}),
"[project]/src/app/providers.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Providers
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/query-core/build/modern/queryClient.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/QueryClientProvider.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next-themes/dist/index.mjs [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/AuthContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/contexts/LanguageContext.tsx [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
"use client";
;
;
;
;
;
;
function Providers({ children }) {
    const [queryClient] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(()=>new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$query$2d$core$2f$build$2f$modern$2f$queryClient$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClient"]({
            defaultOptions: {
                queries: {
                    staleTime: 60 * 1000
                }
            }
        }));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$QueryClientProvider$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["QueryClientProvider"], {
        client: queryClient,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2d$themes$2f$dist$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["ThemeProvider"], {
            defaultTheme: "light",
            attribute: "class",
            enableSystem: true,
            disableTransitionOnChange: true,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$AuthContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["AuthProvider"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$contexts$2f$LanguageContext$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["LanguageProvider"], {
                    children: children
                }, void 0, false, {
                    fileName: "[project]/src/app/providers.tsx",
                    lineNumber: 25,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/src/app/providers.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/src/app/providers.tsx",
            lineNumber: 23,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/src/app/providers.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
}),
"[project]/src/app/FaviconHandler.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>FaviconHandler
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/integrations/supabase/client.ts [app-ssr] (ecmascript)");
"use client";
;
;
function FaviconHandler() {
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const setFavicon = (href, type)=>{
            const ensureLink = (rel)=>{
                let link = document.querySelector(`link[rel="${rel}"]`);
                if (!link) {
                    link = document.createElement("link");
                    link.rel = rel;
                    document.head.appendChild(link);
                }
                return link;
            };
            const icon = ensureLink("icon");
            if (type) icon.type = type;
            icon.href = href;
            const shortcut = ensureLink("shortcut icon");
            if (type) shortcut.type = type;
            shortcut.href = href;
        };
        (async ()=>{
            try {
                // 1) Try app_settings first
                const { data: appData } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("app_settings").select("value").eq("category", "branding").eq("key", "favicon_url").maybeSingle();
                const parseVal = (raw)=>{
                    if (!raw) return null;
                    if (typeof raw === "string") {
                        try {
                            const parsed = JSON.parse(raw);
                            if (typeof parsed === "string") return parsed;
                            if (parsed && typeof parsed === "object" && parsed.url) return parsed.url || null;
                        } catch  {
                            if (/^(https?:)?\//.test(raw)) return raw;
                        }
                    }
                    if (raw && typeof raw === "object" && raw.url) {
                        return raw.url || null;
                    }
                    return null;
                };
                let url = parseVal(appData?.value);
                // 2) Fallback to website_content.site_branding.favicon_url (default to 'en')
                if (!url) {
                    const { data: wc } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$integrations$2f$supabase$2f$client$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["supabase"].from("website_content").select("content").eq("section", "site_branding").eq("language", "en").maybeSingle();
                    const favFromContent = wc?.content?.favicon_url;
                    if (favFromContent && typeof favFromContent === "string" && favFromContent.trim()) {
                        url = favFromContent.trim();
                    }
                }
                // 3) Apply favicon or default
                const apply = (u)=>{
                    const lower = u.toLowerCase();
                    const type = lower.endsWith(".png") ? "image/png" : lower.endsWith(".jpg") || lower.endsWith(".jpeg") ? "image/jpeg" : "image/x-icon";
                    const href = `${u}${u.includes("?") ? "&" : "?"}t=${Date.now()}`;
                    setFavicon(href, type);
                };
                if (url) apply(url);
                else setFavicon("/logo.png", "image/png");
            } catch  {
                // On any error ensure a favicon exists
                setFavicon("/logo.png", "image/png");
            }
        })();
    }, []);
    return null;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__5acd85a0._.js.map