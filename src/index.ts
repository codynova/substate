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

const update = <S extends Record<string | number, any>>(
	store: S,
	key: string | number | undefined,
	value: S[string] | ((state: S[string]) => S[string]) | S | ((store: S) => S)
) => {
	if (key)
		(store as any)[key] =
			typeof value === 'function'
				? (value as any)((store as any)[key])
				: value
	else store = typeof value === 'function' ? (value as any)(store) : value
}

let nextId = 0

export const useCreateSubState = <S extends Record<string | number, any>>(
	initialValue?: S
) => {
	const storeRef = useRef<S>(initialValue || ({} as S))
	const storeSubscriptions = useRef<{
		[id: number]: React.DispatchWithoutAction
	}>({})
	const keySubscriptions = useRef<
		Record<string, { [id: number]: React.DispatchWithoutAction }>
	>({})
	const store = storeRef.current

	const setStore = (
		key: string | number | undefined,
		value: S[string] | S
	) => {
		update<S>(store, key, value)
		const subscriptions = key
			? keySubscriptions.current[key as string]
			: storeSubscriptions.current
		for (const id in subscriptions) {
			subscriptions[id]()
		}
	}

	const subscribe = (
		key: string | number | undefined,
		forceRender: React.DispatchWithoutAction,
		initialValue?: S[string] | S
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
>({} as any)
export const SubStateProvider = SubStateContext.Provider

export const useSubState = <T>(key?: string | number, initialValue?: T) => {
	const { store, setStore, subscribe } = useContext(SubStateContext)
	const [, forceRender] = useReducer((n: number) => n + 1, 0)
	const hasRendered = useRef(false)
	useIsoLayoutEffect(() => {
		hasRendered.current = true
		return subscribe(key, forceRender, initialValue)
	}, [])
	const setState = (value: T | ((currentState: T) => T)) =>
		setStore(key, value)
	let state = (key ? store[key] : store) as T
	if (!hasRendered.current && initialValue !== undefined) {
		state = initialValue
	}

	return { state, setState, store, setStore }
}
