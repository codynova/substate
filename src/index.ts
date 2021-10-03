import {
	useRef,
	useEffect,
	useLayoutEffect,
	createContext,
	useContext,
	useReducer,
} from 'react'

const useIsoLayoutEffect =
	typeof window === 'undefined' ? useEffect : useLayoutEffect

const update = (
	store: { [key: string]: any },
	key: string | undefined,
	value: any
) => {
	if (key)
		store[key] = typeof value === 'function' ? value(store[key]) : value
	else store = typeof value === 'function' ? value(store) : value
}

let nextId = 0

export const useCreateSubState = () => {
	const storeRef = useRef<{ [key: string]: any }>({})
	const storeSubscriptions = useRef<{
		[id: number]: React.DispatchWithoutAction
	}>({})
	const keySubscriptions = useRef<{
		[key: string]: { [id: number]: React.DispatchWithoutAction }
	}>({})
	const store = storeRef.current

	const setStore = (key: string | undefined, value: any) => {
		update(store, key, value)
		const subscriptions = key
			? keySubscriptions.current[key]
			: storeSubscriptions.current
		for (const id in subscriptions) {
			subscriptions[id]()
		}
	}

	const subscribe = (
		key: string | undefined,
		forceRender: React.DispatchWithoutAction,
		initialValue?: any
	) => {
		nextId++

		if (initialValue !== undefined) update(store, key, initialValue)

		if (!key) {
			storeSubscriptions.current[nextId] = forceRender
			return () => void delete storeSubscriptions.current[nextId]
		}

		if (!keySubscriptions.current[key]) keySubscriptions.current[key] = {}
		keySubscriptions.current[key][nextId] = forceRender
		return () => void delete keySubscriptions.current[key][nextId]
	}

	return { store, setStore, subscribe }
}

export const SubStateContext = createContext<
	ReturnType<typeof useCreateSubState>
>([] as any)
export const SubStateProvider = SubStateContext.Provider

export const useSubState = <T>(
	key?: string,
	initialValue?: T | ((state: T) => T)
) => {
	const { store, setStore, subscribe } = useContext(SubStateContext)
	const [, forceRender] = useReducer((n: number) => n + 1, 0)
	const hasRendered = useRef(false)
	useIsoLayoutEffect(() => {
		hasRendered.current = true
		return subscribe(key, forceRender, initialValue)
	}, [])
	const setState = (v: any) => setStore(key, v)
	let state = key ? store[key] : store
	if (!hasRendered.current && initialValue !== undefined) {
		state = initialValue
	}

	return { state, setState, store }
}
