import React, { useEffect, useState } from "react";
import { useToken } from "../../../api/auth";
import AppLoader from "../../../layouts/loading/AppLoader";
import { useMsal } from "@azure/msal-react";
import { useQuery } from "../../../api/query";
import { endpoints } from "../../../api/authConfig";

const AdxIframe = () => {
  const [loading, setLoading] = useState(true);
  const [uri, setUri] = useState("");
  const { instance, accounts } = useMsal();
  const username = sessionStorage.getItem("username");
  const organizationPathQuery = useQuery(
    endpoints[0],
    `GetOrganizationPath_devV1('${username}', #)`
  );

  function mapScope(scope) {
    switch (scope) {
      case "query":
        return ["https://dvmesholyteladx.eastus.kusto.windows.net/.default"];
      case "People.Read":
        return ["People.Read", "User.ReadBasic.All", "Group.Read.All"];
      default:
        return [scope];
    }
  }

  useEffect(() => {
    organizationPathQuery().then((jsonData) => {
      const path = jsonData[0].path;
      const instance = jsonData[0].instance;
      if (path && path !== "") {
        sessionStorage.setItem("organizationPath", path);
      }
      const uriD = `https://dataexplorer.azure.com/dashboards/32007347-c45d-4115-bba4-8d610ccec32c?p-_startTime=1hours&p-_endTime=now&p-_deviceId=all&p-_commodityCode=all&p-_tag=all&p-_opState=all#f37defc3-8ea7-4a11-8926-29761452b4e2p-_org=v-${path}&p-_devices=all&p-_state=all&p-_username=v-${sessionStorage.getItem(
        "username"
      )}&p-_adt=v-${instance}&f-IFrameAuth=true&f-PersistAfterEachRun=true&f-Homepage=false&f-ShowPageHeader=false&f-ShowNavigation=false&f-DisableExploreQuery=false&f-DisableDashboardTopBar=true`;
      setUri(uriD);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleMessage = async (event) => {
      // const token = await getToken();
      if (
        event.data.signature === "queryExplorer" &&
        event.data.type === "getToken"
      ) {
        instance
          .acquireTokenSilent({
            scopes: mapScope(event.data.scope),
            account: accounts[0],
          })
          .then((response) => {
            let accessToken = response.accessToken;
            event.source.postMessage(
              {
                type: "postToken",
                message: accessToken,
                scope: event.data.scope,
              },
              event.origin
            );
          });
      }
    };

    window.addEventListener("message", handleMessage, false);

    return () => {
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  return (
    <>
      {loading ? (
        <AppLoader />
      ) : (
        <iframe
          width="99%"
          height="1000"
          src={uri}
          title="Analytics"
          allowFullScreen
        ></iframe>
      )}
    </>
  );
};

export default AdxIframe;
