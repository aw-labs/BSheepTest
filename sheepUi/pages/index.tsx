import React, { useEffect } from 'react'
import { useSwipeable } from 'react-swipeable'
import Page from '../components/page'
import Section from '../components/section'
import Appbar from '../components/appbar'
import Sheep from '@/components/sheep'
import Mint from '@/components/mint'
import { SheepData } from '@/types'
import { sheepData } from '@/utils/data'
import { AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

import { zeroAddress } from 'viem'

import Game from '../components/Game'
import GetEth from '../components/GetEth'
import Login from '../components/Login'

import { baseGoerli } from 'wagmi/chains'

import { usePrivy } from '@privy-io/react-auth'
import { usePrivyWagmi } from '@privy-io/wagmi-connector'

import { SheepUpContractAbi } from '../data/SheepUpContractAbi'
import { SheepUpContractAddress } from '../data/SheepUpContractAddress'
import {
	useAccount,
	useBalance,
	useContractRead,
	useContractWrite,
	useWaitForTransaction,
	usePrepareContractWrite,
} from 'wagmi'

//graph ql
import { Sheepend } from '../graphql/SheepUpGraph'

type SheepenedData = {
	blockNumber: string
	id: string
	level: string
	shippedAt: string
}

const Index = () => {
	const handlers = useSwipeable({
		onSwiped: (eventData) => console.log('User Swiped!', eventData),
		onSwipedUp: () => console.log('Swiped Up'),
		onSwipedLeft: () => console.log('Swiped Left'),
	})
	const [sheep, setSheep] = useState<SheepData[]>(sheepData)
	const [rightSwipe, setRightSwipe] = useState(0)
	const [leftSwipe, setLeftSwipe] = useState(0)
	const [taps, setTaps] = useState<number[]>([])
	const [ship, setShip] = useState(0)

	async function sheepend() {
		console.log('sheepend')
		try {
			const data = await Sheepend()

			if (data && data.sheepeneds) {
				console.log('@@@data.sheepeneds1=', data.sheepeneds)
				const formattedSheepData = data.sheepeneds.map((sheep: any) => ({
					...sheep,
					id: parseInt(sheep.id, 10),
				}))
				setSheep(data.sheepeneds)
			}
		} catch (err) {
			if (err instanceof Error) {
				console.error(err.message)
			} else {
				console.error('An unexpected error occurred.')
			}
		}
	}

	const activeIndex = sheep.length - 1
	const removeSheep = (id: number, action: 'right' | 'left') => {
		setSheep((prev) => prev.filter((sheep) => sheep.id !== id))
		if (action === 'right') {
			setRightSwipe((prev) => prev + 1)
		} else {
			setLeftSwipe((prev) => prev + 1)
		}
	}
	const tapCard = (id: number) => {
		setTaps((prev) => [...prev, id])
		// TODO when initial, cannot add taps to the array
		if (taps.length >= 9) {
			writeTaps?.()
			setTaps([])
		}
	}
	const shipCard = (id: number) => {
		setShip(id)
		writeShip?.()
	}

	const { ready } = usePrivy()
	const { wallet: activeWallet, setActiveWallet } = usePrivyWagmi()
	const { address, isConnected } = useAccount()

	const {
		data,
		isLoading: isBalanceLoading,
		refetch,
	} = useBalance({
		address: address ?? zeroAddress,
		//TODO
		chainId: baseGoerli.id,
	})

	const balance = data?.value

	useEffect(() => {
		const interval = setInterval(() => {
			refetch()
		}, 3000)
		return () => clearInterval(interval)
	}, [])

	useEffect(() => {
		sheepend()
	}, [])

	//send tx
	const { config } = usePrepareContractWrite({
		address: SheepUpContractAddress,
		abi: SheepUpContractAbi,
		functionName: 'taps',
		args: [taps],
		enabled: !!SheepUpContractAddress,
	})
	const { write: writeTaps } = useContractWrite(config)

	const { config: configShip } = usePrepareContractWrite({
		address: SheepUpContractAddress,
		abi: SheepUpContractAbi,
		functionName: 'ship',
		args: [ship],
		enabled: !!SheepUpContractAddress,
	})
	const { write: writeShip } = useContractWrite(configShip)

	const NotSpDisplay = () => {
		return (
			<div className='hidden sm:flex flex-col items-center justify-center bg-blue h-screen'>
				<img src='/images/sheep.svg' alt='Sheep Icon' className='w-18 h-18' />
				<p className='p-2 font-bold text-4xl text-white'>Sheep It</p>
				<p className='p-2 font-bold text-md text-white'>
					An onchain Sheeping (Sheep * ship it) game
				</p>
				<div className='bg-gray rounded-md p-4 mt-8'>
					<p className='text-black font-bold'>
						Sheep It is only on mobile. Visit on your phone to play.
					</p>
				</div>
			</div>
		)
	}

	if (!address) {
		return (
			<>
				<NotSpDisplay />
				<div className='sm:hidden absolute top-0 left-0 h-screen w-screen bg-stone-100'>
					<Login />
				</div>
			</>
		)
	}
	if (!balance) {
		return (
			<>
				<NotSpDisplay />
				<div className='sm:hidden absolute top-0 left-0 h-screen w-screen bg-stone-100'>
					<GetEth address={address} />
				</div>
			</>
		)
	}

	return (
		<>
			<NotSpDisplay />
			<div className='sm:hidden'>
        <Appbar furAmount={1000} tapAmount={10} shipAmount={3} />
				<Page>
					<div className='relative flex flex-wrap w-ful'>
						<AnimatePresence>
							{sheep.length ? (
								sheep.map((sheep) => (
									<Sheep
										key={sheep.id}
										data={sheep}
										active={true}
										removeSheep={removeSheep}
										tapCard={tapCard}
										shipCard={shipCard}
									/>
								))
							) : (
								<h2 className='absolute z-10 text-center text-2xl font-bold'>
									Excessive swiping can be injurious to health!
									<br />
									Come back tomorrow for more
								</h2>
							)}
						</AnimatePresence>
						<Mint/>
					</div>
				</Page>
			</div>
		</>
	)
}

export default Index
