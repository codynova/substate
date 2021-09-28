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
	state: { [key: string]: any },
	key: string | undefined,
	value: any
) => {
	if (key)
		state[key] = typeof value === 'function' ? value(state[key]) : value
	else state = typeof value === 'function' ? value(state) : value
}

let nextId = 0

export const useCreateSubState = () => {
	const stateRef = useRef<{ [key: string]: any }>({})
	const storeSubscriptions = useRef<{
		[id: number]: React.DispatchWithoutAction
	}>({})
	const keySubscriptions = useRef<{
		[key: string]: { [id: number]: React.DispatchWithoutAction }
	}>({})
	const state = stateRef.current

	const setState = (key: string | undefined, value: any) => {
		update(state, key, value)
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

		if (initialValue !== undefined) update(state, key, initialValue)

		if (!key) {
			storeSubscriptions.current[nextId] = forceRender
			return () => void delete storeSubscriptions.current[nextId]
		}

		if (!keySubscriptions.current[key]) keySubscriptions.current[key] = {}
		keySubscriptions.current[key][nextId] = forceRender
		return () => void delete keySubscriptions.current[key][nextId]
	}

	return [state, setState, subscribe] as [
		typeof state,
		typeof setState,
		typeof subscribe
	]
}

export const SubStateContext = createContext<
	ReturnType<typeof useCreateSubState>
>([] as any)
export const SubStateProvider = SubStateContext.Provider

export const useSubState = <T>(
	key?: string,
	initialValue?: T | ((state: T) => T)
) => {
	const [subState, setSubState, subscribe] = useContext(SubStateContext)
	const [, forceRender] = useReducer((n: number) => n + 1, 0)
	const hasRendered = useRef(false)
	useIsoLayoutEffect(() => {
		hasRendered.current = true
		return subscribe(key, forceRender, initialValue)
	}, [])
	const setState = (v: T) => setSubState(key, v)
	let state = key ? subState[key] : subState
	if (!hasRendered.current && initialValue !== undefined) {
		state = initialValue
	}

	return [state, setState] as [T, React.Dispatch<React.SetStateAction<T>>]
}
