import {
    init,
    OpacityEnvironment,
    get as opacityGet,
} from '@opacity-labs/react-native-opacity'
import { useEffect, useState } from 'react'
import { Button } from 'react-native'
import {ThemedText} from "@/components/ThemedText";


export function SpotifyProfile(): React.JSX.Element {

    const [result, setResult] = useState("")

    useEffect(() => {
        console.log("api key: ", process.env.EXPO_PUBLIC_OPACITY_API_KEY)
        init("example-app-e0604831-e8a1-4674-a098-6e85315984a2", false, OpacityEnvironment.Production, true).catch((reason): void => console.log("error: ", reason, ", api key: ", api_key))
    }, [])


    const getSpotifyProfile = async evt => {
        setResult(JSON.stringify(await opacityGet('flow:spotify:profile'), null, 2))
    }

    return (
        <>
            <Button
                title="Get Spotify Profile"
                onPress={getSpotifyProfile}
            />
            <ThemedText>{result}</ThemedText>
        </>
    )
}
