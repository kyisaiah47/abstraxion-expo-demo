import {
    init,
    OpacityEnvironment,
    get as opacityGet,
} from '@opacity-labs/react-native-opacity'
import { useState } from 'react'
import { Button } from 'react-native'
import {ThemedText} from "@/components/ThemedText";

init({apiKey:process.env.EXPO_PUBLIC_OPACITY_API_KEY, dryRun: false, environment: OpacityEnvironment.Production, shouldShowErrorsInWebView: true})


export function SpotifyProfile(): React.JSX.Element {

    const [result, setResult] = useState("")


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
