<?php
/*
 *  Factory+ / AMRC Connectivity Stack (ACS) Manager component
 *  Copyright 2024 University of Sheffield AMRC
 */

namespace App\Http\Controllers;

use AMRCFactoryPlus\ServiceClient;
use AMRCFactoryPlus\UUIDs;
use App\Exceptions\ActionFailException;
use App\Http\Requests\StoreSensitiveInformationRequest;

class ServiceProxyController extends Controller
{
    public function urlinfo ()
    {
        $fplus = resolve(ServiceClient::class);
        return action_success([
            "base"      => $fplus->baseUrl,
            "scheme"    => $fplus->scheme,
        ]);
    }

    public function token ()
    {
        $service = request()->route("service");
        $fplus = resolve(ServiceClient::class);
        $token = $fplus->getToken($service, true);

        return action_success($token);
    }
}
